"""
Achievement system definitions and checking logic.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone


# Achievement definitions
ACHIEVEMENTS = {
    # Completion Achievements
    "FirstProblem": {
        "id": "FirstProblem",
        "name": "First Steps",
        "description": "Complete your first problem",
        "icon_name": "Target",
        "category": "completion"
    },
    "TopicComplete": {
        "id": "TopicComplete",
        "name": "Topic Master",
        "description": "Complete all problems in a topic",
        "icon_name": "BookOpen",
        "category": "completion"
    },
    "ExamComplete": {
        "id": "ExamComplete",
        "name": "Exam Ready",
        "description": "Complete all problems in an exam",
        "icon_name": "GraduationCap",
        "category": "completion"
    },
    "AllTopicsComplete": {
        "id": "AllTopicsComplete",
        "name": "Course Complete",
        "description": "Complete all topics",
        "icon_name": "Trophy",
        "category": "completion"
    },
    # Improvement Achievements
    "HardToEasy": {
        "id": "HardToEasy",
        "name": "Rising Star",
        "description": "Improve a problem from hard to easy",
        "icon_name": "TrendingUp",
        "category": "improvement"
    },
    "ConsistentProgress": {
        "id": "ConsistentProgress",
        "name": "On the Rise",
        "description": "Make multiple improvements in a session",
        "icon_name": "ArrowUp",
        "category": "improvement"
    },
    "MasteryImprovement": {
        "id": "MasteryImprovement",
        "name": "Level Up",
        "description": "Increase topic or exam mastery level",
        "icon_name": "Zap",
        "category": "improvement"
    },
    # Consistency Achievements
    "Streak7Days": {
        "id": "Streak7Days",
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon_name": "Flame",
        "category": "consistency"
    },
    "Streak30Days": {
        "id": "Streak30Days",
        "name": "Month Master",
        "description": "Maintain a 30-day streak",
        "icon_name": "Flame",
        "category": "consistency"
    },
    "PerfectWeek": {
        "id": "PerfectWeek",
        "name": "Perfect Week",
        "description": "7 consecutive days with activity",
        "icon_name": "Calendar",
        "category": "consistency"
    },
    "DailyGrinder": {
        "id": "DailyGrinder",
        "name": "Daily Grinder",
        "description": "10+ days of activity",
        "icon_name": "Clock",
        "category": "consistency"
    },
    # Milestone Achievements
    "Problems10": {
        "id": "Problems10",
        "name": "Getting Started",
        "description": "Complete 10 problems",
        "icon_name": "Star",
        "category": "milestone"
    },
    "Problems50": {
        "id": "Problems50",
        "name": "Making Progress",
        "description": "Complete 50 problems",
        "icon_name": "Award",
        "category": "milestone"
    },
    "Problems100": {
        "id": "Problems100",
        "name": "Century Club",
        "description": "Complete 100 problems",
        "icon_name": "Medal",
        "category": "milestone"
    },
    "Problems250": {
        "id": "Problems250",
        "name": "Problem Solver",
        "description": "Complete 250 problems",
        "icon_name": "Crown",
        "category": "milestone"
    },
    "HalfwayThere": {
        "id": "HalfwayThere",
        "name": "Halfway There",
        "description": "Complete 50% of exam problems",
        "icon_name": "CheckCircle2",
        "category": "milestone"
    },
    "AlmostThere": {
        "id": "AlmostThere",
        "name": "Almost There",
        "description": "Complete 75% of exam problems",
        "icon_name": "CheckCircle",
        "category": "milestone"
    }
}


def get_all_achievements() -> List[Dict[str, Any]]:
    """Return all achievement definitions."""
    return list(ACHIEVEMENTS.values())


def get_achievement(achievement_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific achievement by ID."""
    return ACHIEVEMENTS.get(achievement_id)


def check_completion_achievements(
    stats: Dict[str, Any],
    study_data: Dict[str, Any],
    topic_id: Optional[str] = None,
    exam_id: Optional[str] = None
) -> List[str]:
    """Check for completion achievements."""
    unlocked = []
    
    # FirstProblem
    if "FirstProblem" not in stats["achievements_earned"] and stats["total_attempts"] >= 1:
        unlocked.append("FirstProblem")
    
    # TopicComplete
    if topic_id and "TopicComplete" not in stats["achievements_earned"]:
        topics = study_data.get("topics", [])
        topic = next((t for t in topics if t.get("id") == topic_id), None)
        if topic:
            all_attempted = all(
                p.get("history") and len(p.get("history", [])) > 0
                for p in topic.get("problems", [])
            )
            if all_attempted and topic_id not in stats["topics_completed"]:
                unlocked.append("TopicComplete")
    
    # ExamComplete
    if exam_id and "ExamComplete" not in stats["achievements_earned"]:
        # This will be checked separately with exam data
        pass
    
    # AllTopicsComplete
    if "AllTopicsComplete" not in stats["achievements_earned"]:
        topics = study_data.get("topics", [])
        all_completed = all(
            topic_id in stats["topics_completed"]
            for topic in topics
            if (topic_id := topic.get("id"))
        )
        if all_completed and len(topics) > 0:
            unlocked.append("AllTopicsComplete")
    
    return unlocked


def check_improvement_achievements(
    stats: Dict[str, Any],
    problem_history: List[Dict[str, Any]],
    new_rating: str
) -> List[str]:
    """Check for improvement achievements."""
    unlocked = []
    
    if len(problem_history) < 2:
        return unlocked
    
    # Get previous rating
    previous_rating = problem_history[-2].get("rating")
    current_rating = new_rating
    
    # HardToEasy
    if previous_rating == "hard" and current_rating == "easy":
        if "HardToEasy" not in stats["achievements_earned"]:
            unlocked.append("HardToEasy")
    
    # ConsistentProgress - check if multiple improvements in recent history
    improvements = 0
    for i in range(1, min(len(problem_history), 5)):
        prev = problem_history[-i-1].get("rating") if len(problem_history) > i else None
        curr = problem_history[-i].get("rating")
        if prev and curr:
            if (prev == "hard" and curr in ["medium", "easy"]) or \
               (prev == "medium" and curr == "easy"):
                improvements += 1
    
    if improvements >= 2 and "ConsistentProgress" not in stats["achievements_earned"]:
        unlocked.append("ConsistentProgress")
    
    return unlocked


def check_consistency_achievements(stats: Dict[str, Any]) -> List[str]:
    """Check for consistency achievements."""
    unlocked = []
    
    # Streak7Days
    if stats["current_streak"] >= 7 and "Streak7Days" not in stats["achievements_earned"]:
        unlocked.append("Streak7Days")
    
    # Streak30Days
    if stats["current_streak"] >= 30 and "Streak30Days" not in stats["achievements_earned"]:
        unlocked.append("Streak30Days")
    
    # PerfectWeek - 7 consecutive days
    if stats["current_streak"] >= 7 and "PerfectWeek" not in stats["achievements_earned"]:
        unlocked.append("PerfectWeek")
    
    # DailyGrinder - 10+ days of activity
    active_days = len([d for d, count in stats["daily_activity"].items() if count > 0])
    if active_days >= 10 and "DailyGrinder" not in stats["achievements_earned"]:
        unlocked.append("DailyGrinder")
    
    return unlocked


def check_milestone_achievements(stats: Dict[str, Any], exam_progress: Optional[float] = None) -> List[str]:
    """Check for milestone achievements."""
    unlocked = []
    
    total_attempts = stats["total_attempts"]
    
    # Problems10
    if total_attempts >= 10 and "Problems10" not in stats["achievements_earned"]:
        unlocked.append("Problems10")
    
    # Problems50
    if total_attempts >= 50 and "Problems50" not in stats["achievements_earned"]:
        unlocked.append("Problems50")
    
    # Problems100
    if total_attempts >= 100 and "Problems100" not in stats["achievements_earned"]:
        unlocked.append("Problems100")
    
    # Problems250
    if total_attempts >= 250 and "Problems250" not in stats["achievements_earned"]:
        unlocked.append("Problems250")
    
    # HalfwayThere - 50% of exam
    if exam_progress is not None and exam_progress >= 0.5:
        if "HalfwayThere" not in stats["achievements_earned"]:
            unlocked.append("HalfwayThere")
    
    # AlmostThere - 75% of exam
    if exam_progress is not None and exam_progress >= 0.75:
        if "AlmostThere" not in stats["achievements_earned"]:
            unlocked.append("AlmostThere")
    
    return unlocked


def check_all_achievements(
    stats: Dict[str, Any],
    study_data: Dict[str, Any],
    topic_id: Optional[str] = None,
    exam_id: Optional[str] = None,
    problem_history: Optional[List[Dict[str, Any]]] = None,
    new_rating: Optional[str] = None,
    exam_progress: Optional[float] = None
) -> List[str]:
    """Check all achievement categories and return newly unlocked achievements."""
    unlocked = []
    
    # Completion achievements
    unlocked.extend(check_completion_achievements(stats, study_data, topic_id, exam_id))
    
    # Improvement achievements
    if problem_history and new_rating:
        unlocked.extend(check_improvement_achievements(stats, problem_history, new_rating))
    
    # Consistency achievements
    unlocked.extend(check_consistency_achievements(stats))
    
    # Milestone achievements
    unlocked.extend(check_milestone_achievements(stats, exam_progress))
    
    # Remove duplicates and return
    return list(set(unlocked))
