from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel


class AttemptRequest(BaseModel):
    """Request model for POST /api/attempt endpoint."""
    topic_id: str
    problem_id: str
    rating: Literal["easy", "medium", "hard"]
    timestamp: Optional[str] = None  # ISO 8601 format


class AttemptResponse(BaseModel):
    """Response model for POST /api/attempt endpoint."""
    message: str
    achievements_unlocked: List[str] = []


class UserStats(BaseModel):
    """User statistics model for gamification."""
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None  # ISO format, UTC
    total_problems_solved: int = 0  # total attempts
    total_attempts: int = 0
    achievements_earned: List[str] = []  # achievement IDs
    achievement_history: List[Dict[str, Any]] = []  # with timestamp and achievement_id
    daily_activity: Dict[str, int] = {}  # date string -> problem count
    topics_completed: List[str] = []  # topic IDs
    exams_completed: List[str] = []  # exam IDs