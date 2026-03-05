from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from models import AttemptRequest, AttemptResponse, UserStats
from data_service import (
    load_study_data,
    save_study_data,
    create_backup,
    append_attempt,
    ensure_data_directory,
    initialize_data_file,
    load_user_stats,
    save_user_stats,
    update_streak,
    record_activity,
    award_achievement,
    find_problem,
    get_default_study_data
)
from achievements import check_all_achievements, get_all_achievements, get_achievement


app = FastAPI(title="Study Helper API", version="1.0.0")

# Path to problems-and-solutions directory
PROBLEMS_DIR = Path(__file__).parent.parent / "problems-and-solutions"
# Path to exam data file
EXAM_DATA_FILE = Path(__file__).parent.parent / "parser" / "data" / "exam_data.json"

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize data directory and create backup on startup."""
    ensure_data_directory()
    initialize_data_file()
    create_backup()


@app.get("/api/syllabus")
async def get_syllabus():
    """
    Get the full syllabus data.
    
    Returns:
        The complete study_data.json as JSON.
    """
    try:
        # Ensure data file exists (in case it wasn't initialized)
        initialize_data_file()
        data = load_study_data()
        return data
    except FileNotFoundError as e:
        # If file still doesn't exist, return empty structure
        return get_default_study_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading study data: {str(e)}")


@app.get("/api/exams")
async def get_exams():
    """
    Get the exam data.
    
    Returns:
        The complete exam_data.json as JSON.
    """
    import json
    try:
        if not EXAM_DATA_FILE.exists():
            raise HTTPException(status_code=404, detail=f"Exam data file not found: {EXAM_DATA_FILE}")
        
        with open(EXAM_DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading exam data: {str(e)}")


@app.post("/api/attempt", response_model=AttemptResponse)
async def log_attempt(attempt_request: AttemptRequest):
    """
    Log a user's attempt at a specific problem.
    
    Args:
        attempt_request: The attempt data including topic_id, problem_id, rating, and optional timestamp.
        
    Returns:
        Success message confirming the attempt was logged and any achievements unlocked.
    """
    try:
        # Generate timestamp if not provided
        timestamp = attempt_request.timestamp
        if timestamp is None:
            timestamp = datetime.now(timezone.utc).isoformat()
        
        # Load study data
        data = load_study_data()
        
        # Get problem to check history
        problem = find_problem(data, attempt_request.topic_id, attempt_request.problem_id)
        if problem is None:
            raise HTTPException(status_code=404, detail=f"Problem not found")
        
        problem_history = problem.get("history", [])
        
        # Prepare attempt object
        attempt = {
            "topic_id": attempt_request.topic_id,
            "problem_id": attempt_request.problem_id,
            "rating": attempt_request.rating,
            "timestamp": timestamp
        }
        
        # Append attempt to problem's history
        try:
            append_attempt(data, attempt_request.topic_id, attempt_request.problem_id, attempt)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        
        # Save updated data
        save_study_data(data)
        
        # Update user stats
        stats = load_user_stats()
        stats["total_attempts"] = stats.get("total_attempts", 0) + 1
        stats["total_problems_solved"] = stats.get("total_problems_solved", 0) + 1
        
        # Update streak
        update_streak(stats, timestamp)
        
        # Record daily activity
        record_activity(stats, timestamp)
        
        # Check if topic is now complete
        topic = next((t for t in data.get("topics", []) if t.get("id") == attempt_request.topic_id), None)
        if topic:
            all_attempted = all(
                p.get("history") and len(p.get("history", [])) > 0
                for p in topic.get("problems", [])
            )
            if all_attempted and attempt_request.topic_id not in stats.get("topics_completed", []):
                stats.setdefault("topics_completed", []).append(attempt_request.topic_id)
        
        # Calculate exam progress for milestone achievements
        # Find which exam this topic belongs to (simplified - check all exams)
        exam_progress = None
        try:
            import json
            if EXAM_DATA_FILE.exists():
                with open(EXAM_DATA_FILE, 'r', encoding='utf-8') as f:
                    exam_data = json.load(f)
                    # For now, we'll calculate progress per exam section
                    # This is a simplified version
                    pass
        except Exception:
            pass
        
        # Check for achievements
        updated_history = problem.get("history", [])
        unlocked = check_all_achievements(
            stats,
            data,
            topic_id=attempt_request.topic_id,
            exam_id=None,  # Could be enhanced to detect exam
            problem_history=updated_history,
            new_rating=attempt_request.rating,
            exam_progress=exam_progress
        )
        
        # Award achievements
        achievements_unlocked = []
        for achievement_id in unlocked:
            if achievement_id not in stats.get("achievements_earned", []):
                award_achievement(stats, achievement_id)
                achievements_unlocked.append(achievement_id)
        
        # Save updated stats
        save_user_stats(stats)
        
        return AttemptResponse(
            message="Attempt logged successfully",
            achievements_unlocked=achievements_unlocked
        )
        
    except HTTPException:
        raise
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Study data file not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging attempt: {str(e)}")


@app.post("/api/upload")
async def upload_schedule(file: UploadFile = File(...)):
    """
    Upload and parse a syllabus image file.
    
    Args:
        file: The uploaded image file (PNG/JPEG)
        
    Returns:
        Parsed study data as JSON (for preview)
        
    Note:
        This endpoint returns the parsed data but does not save it.
        The frontend should call a separate endpoint to save, or we can add
        a query parameter to save immediately.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (PNG, JPEG, etc.)"
            )
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Parse the image
        try:
            parsed_data = parse_syllabus_image(file_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Parsing error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"API error: {str(e)}")
        
        # Return parsed data for preview
        return parsed_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")


@app.post("/api/upload/save")
async def save_schedule(data: dict):
    """
    Save parsed schedule data to study_data.json.
    
    Args:
        data: The parsed study data dictionary
        
    Returns:
        Success message
    """
    try:
        # Validate the data structure
        if "topics" not in data or not isinstance(data["topics"], list):
            raise HTTPException(status_code=400, detail="Invalid data structure")
        
        # Create backup before saving
        create_backup()
        
        # Save the data
        save_study_data(data)
        
        return {"message": "Schedule saved successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving schedule: {str(e)}")


@app.get("/api/stats", response_model=UserStats)
async def get_stats():
    """
    Get user statistics.
    
    Returns:
        User statistics including streaks, achievements, and activity.
    """
    try:
        stats = load_user_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading stats: {str(e)}")


@app.get("/api/achievements")
async def get_achievements():
    """
    Get all available achievements with earned status.
    
    Returns:
        List of achievements with earned status.
    """
    try:
        stats = load_user_stats()
        earned_set = set(stats.get("achievements_earned", []))
        
        all_achievements = get_all_achievements()
        result = []
        
        for achievement in all_achievements:
            achievement_id = achievement["id"]
            earned = achievement_id in earned_set
            
            # Find when it was earned
            earned_at = None
            if earned:
                history = stats.get("achievement_history", [])
                for entry in history:
                    if entry.get("achievement_id") == achievement_id:
                        earned_at = entry.get("timestamp")
                        break
            
            result.append({
                **achievement,
                "earned": earned,
                "earnedAt": earned_at
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading achievements: {str(e)}")


@app.get("/api/streak")
async def get_streak():
    """
    Get current streak information.
    
    Returns:
        Streak information including current streak, longest streak, and last activity date.
    """
    try:
        stats = load_user_stats()
        return {
            "current_streak": stats.get("current_streak", 0),
            "longest_streak": stats.get("longest_streak", 0),
            "last_activity_date": stats.get("last_activity_date")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading streak: {str(e)}")


@app.get("/api/pdf/{filename}")
async def get_pdf(filename: str):
    """
    Serve PDF files from the problems-and-solutions directory.
    
    Args:
        filename: The PDF filename (e.g., "preliminaries-no-solutions.pdf")
        
    Returns:
        The PDF file
    """
    # Security: Only allow PDF files and prevent directory traversal
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Prevent directory traversal attacks
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    pdf_path = PROBLEMS_DIR / filename
    
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF not found: {filename}")
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
