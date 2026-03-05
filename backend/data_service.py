import json
import shutil
from pathlib import Path
from typing import Dict, Optional, Any, List
from datetime import datetime, timezone, timedelta


# Path to the data directory relative to this file
DATA_DIR = Path(__file__).parent / "data"
STUDY_DATA_FILE = DATA_DIR / "study_data.json"
BACKUP_FILE = DATA_DIR / "study_data.backup.json"
USER_STATS_FILE = DATA_DIR / "user_stats.json"
PARSER_DATA_FILE = Path(__file__).parent.parent / "parser" / "data" / "study_data.json"


def ensure_data_directory() -> None:
    """Ensure the data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_default_study_data() -> Dict[str, Any]:
    """Return default empty study data structure."""
    return {
        "course_title": "",
        "topics": []
    }


def initialize_data_file() -> None:
    """Initialize study data file if it doesn't exist."""
    ensure_data_directory()
    
    if not STUDY_DATA_FILE.exists():
        # Try to copy from parser data if it exists
        if PARSER_DATA_FILE.exists():
            shutil.copy2(PARSER_DATA_FILE, STUDY_DATA_FILE)
        else:
            # Create empty structure if no parser data exists
            default_data = get_default_study_data()
            save_study_data(default_data)


def load_study_data() -> Dict[str, Any]:
    """
    Load study data from JSON file.
    
    Returns:
        Dict containing the study data.
        
    Raises:
        FileNotFoundError: If the data file doesn't exist.
        json.JSONDecodeError: If the file contains invalid JSON.
    """
    if not STUDY_DATA_FILE.exists():
        raise FileNotFoundError(f"Study data file not found: {STUDY_DATA_FILE}")
    
    with open(STUDY_DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_study_data(data: Dict[str, Any]) -> None:
    """
    Save study data to JSON file.
    
    Args:
        data: The study data dictionary to save.
        
    Raises:
        IOError: If the file cannot be written.
    """
    ensure_data_directory()
    
    with open(STUDY_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_backup() -> None:
    """
    Create a backup copy of study_data.json.
    Overwrites existing backup if it exists.
    """
    ensure_data_directory()
    
    if STUDY_DATA_FILE.exists():
        shutil.copy2(STUDY_DATA_FILE, BACKUP_FILE)


def find_problem(data: Dict[str, Any], topic_id: str, problem_id: str) -> Optional[Dict[str, Any]]:
    """
    Find a specific problem in the study data.
    
    Args:
        data: The study data dictionary.
        topic_id: The ID of the topic.
        problem_id: The ID of the problem.
        
    Returns:
        The problem dictionary if found, None otherwise.
    """
    topics = data.get("topics", [])
    
    for topic in topics:
        if topic.get("id") == topic_id:
            problems = topic.get("problems", [])
            for problem in problems:
                if problem.get("id") == problem_id:
                    return problem
    
    return None


def append_attempt(data: Dict[str, Any], topic_id: str, problem_id: str, attempt: Dict[str, Any]) -> None:
    """
    Append an attempt to a problem's history array.
    
    Args:
        data: The study data dictionary (will be modified in place).
        topic_id: The ID of the topic.
        problem_id: The ID of the problem.
        attempt: The attempt dictionary to append.
        
    Raises:
        ValueError: If the topic or problem is not found.
    """
    problem = find_problem(data, topic_id, problem_id)
    
    if problem is None:
        raise ValueError(f"Problem '{problem_id}' not found in topic '{topic_id}'")
    
    if "history" not in problem:
        problem["history"] = []
    
    problem["history"].append(attempt)


def get_default_user_stats() -> Dict[str, Any]:
    """Return default user statistics."""
    return {
        "current_streak": 0,
        "longest_streak": 0,
        "last_activity_date": None,
        "total_problems_solved": 0,
        "total_attempts": 0,
        "achievements_earned": [],
        "achievement_history": [],
        "daily_activity": {},
        "topics_completed": [],
        "exams_completed": []
    }


def load_user_stats() -> Dict[str, Any]:
    """
    Load user statistics from JSON file.
    If file doesn't exist, returns default stats and initializes from history.
    
    Returns:
        Dict containing the user statistics.
    """
    ensure_data_directory()
    
    if not USER_STATS_FILE.exists():
        # Initialize from existing history
        stats = get_default_user_stats()
        stats = initialize_user_stats_from_history(stats)
        save_user_stats(stats)
        return stats
    
    try:
        with open(USER_STATS_FILE, 'r', encoding='utf-8') as f:
            stats = json.load(f)
            # Ensure all fields exist
            default = get_default_user_stats()
            for key, value in default.items():
                if key not in stats:
                    stats[key] = value
            return stats
    except (FileNotFoundError, json.JSONDecodeError):
        # If file is corrupted, initialize fresh
        stats = get_default_user_stats()
        stats = initialize_user_stats_from_history(stats)
        save_user_stats(stats)
        return stats


def save_user_stats(stats: Dict[str, Any]) -> None:
    """
    Save user statistics to JSON file.
    
    Args:
        stats: The user statistics dictionary to save.
        
    Raises:
        IOError: If the file cannot be written.
    """
    ensure_data_directory()
    
    with open(USER_STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)


def initialize_user_stats_from_history(stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate retroactive statistics from existing attempt history.
    
    Args:
        stats: User stats dictionary to populate.
        
    Returns:
        Updated stats dictionary.
    """
    try:
        study_data = load_study_data()
    except FileNotFoundError:
        return stats
    
    # Process all attempts from history
    all_attempts = []
    topics = study_data.get("topics", [])
    
    for topic in topics:
        topic_id = topic.get("id")
        problems = topic.get("problems", [])
        
        for problem in problems:
            history = problem.get("history", [])
            for attempt in history:
                attempt_date = attempt.get("timestamp")
                if attempt_date:
                    all_attempts.append({
                        "topic_id": topic_id,
                        "problem_id": problem.get("id"),
                        "rating": attempt.get("rating"),
                        "timestamp": attempt_date
                    })
    
    # Sort by timestamp
    all_attempts.sort(key=lambda x: x.get("timestamp", ""))
    
    # Calculate stats
    stats["total_attempts"] = len(all_attempts)
    stats["total_problems_solved"] = len(all_attempts)
    
    # Track daily activity and streaks
    daily_activity = {}
    last_date = None
    current_streak = 0
    longest_streak = 0
    streak_start = None
    
    for attempt in all_attempts:
        timestamp = attempt.get("timestamp")
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                date_str = dt.date().isoformat()
                
                # Update daily activity
                daily_activity[date_str] = daily_activity.get(date_str, 0) + 1
                
                # Update streak
                if last_date is None:
                    current_streak = 1
                    streak_start = dt.date()
                else:
                    days_diff = (dt.date() - last_date).days
                    if days_diff == 0:
                        # Same day, continue streak
                        pass
                    elif days_diff == 1:
                        # Consecutive day
                        current_streak += 1
                    else:
                        # Streak broken
                        longest_streak = max(longest_streak, current_streak)
                        current_streak = 1
                        streak_start = dt.date()
                
                last_date = dt.date()
                longest_streak = max(longest_streak, current_streak)
                
            except (ValueError, AttributeError):
                continue
    
    stats["daily_activity"] = daily_activity
    stats["current_streak"] = current_streak
    stats["longest_streak"] = longest_streak
    if last_date:
        stats["last_activity_date"] = last_date.isoformat()
    
    # Check completed topics
    topics_completed = []
    for topic in topics:
        topic_id = topic.get("id")
        problems = topic.get("problems", [])
        if all(p.get("history") and len(p.get("history", [])) > 0 for p in problems):
            topics_completed.append(topic_id)
    stats["topics_completed"] = topics_completed
    
    return stats


def get_utc_date_string(timestamp: Optional[str] = None) -> str:
    """Get UTC date string (YYYY-MM-DD) from timestamp or current time."""
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.date().isoformat()
        except (ValueError, AttributeError):
            pass
    
    return datetime.now(timezone.utc).date().isoformat()


def update_streak(stats: Dict[str, Any], timestamp: str) -> None:
    """
    Update streak based on activity timestamp.
    Uses UTC calendar days.
    
    Args:
        stats: User stats dictionary (modified in place).
        timestamp: ISO format timestamp of the activity.
    """
    current_date_str = get_utc_date_string(timestamp)
    current_date = datetime.fromisoformat(current_date_str).date()
    
    last_activity = stats.get("last_activity_date")
    
    if last_activity is None:
        # First activity
        stats["current_streak"] = 1
        stats["last_activity_date"] = current_date_str
        stats["longest_streak"] = max(stats.get("longest_streak", 0), 1)
    else:
        try:
            last_date = datetime.fromisoformat(last_activity).date()
            days_diff = (current_date - last_date).days
            
            if days_diff == 0:
                # Same day, streak continues
                pass
            elif days_diff == 1:
                # Consecutive day, increment streak
                stats["current_streak"] = stats.get("current_streak", 0) + 1
                stats["last_activity_date"] = current_date_str
                stats["longest_streak"] = max(stats.get("longest_streak", 0), stats["current_streak"])
            else:
                # Streak broken, reset to 1
                stats["current_streak"] = 1
                stats["last_activity_date"] = current_date_str
        except (ValueError, AttributeError):
            # Invalid date, treat as new streak
            stats["current_streak"] = 1
            stats["last_activity_date"] = current_date_str


def record_activity(stats: Dict[str, Any], timestamp: str) -> None:
    """
    Record daily activity.
    
    Args:
        stats: User stats dictionary (modified in place).
        timestamp: ISO format timestamp of the activity.
    """
    date_str = get_utc_date_string(timestamp)
    
    if "daily_activity" not in stats:
        stats["daily_activity"] = {}
    
    stats["daily_activity"][date_str] = stats["daily_activity"].get(date_str, 0) + 1


def award_achievement(stats: Dict[str, Any], achievement_id: str) -> None:
    """
    Award an achievement to the user.
    
    Args:
        stats: User stats dictionary (modified in place).
        achievement_id: ID of the achievement to award.
    """
    if achievement_id not in stats.get("achievements_earned", []):
        stats.setdefault("achievements_earned", []).append(achievement_id)
        
        # Add to history
        history_entry = {
            "achievement_id": achievement_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        stats.setdefault("achievement_history", []).append(history_entry)
