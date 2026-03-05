export interface Attempt {
  topic_id: string;
  problem_id: string;
  rating: "easy" | "medium" | "hard";
  timestamp: string; // ISO 8601 format
}

export interface Problem {
  id: string;
  label: string;
  history: Attempt[];
}

export interface Topic {
  id: string;
  date: string;
  name: string;
  problems: Problem[];
}

export interface StudyData {
  course_title: string;
  topics: Topic[];
}

export interface AttemptRequest {
  topic_id: string;
  problem_id: string;
  rating: "easy" | "medium" | "hard";
  timestamp?: string;
}

export interface AttemptResponse {
  message: string;
  achievements_unlocked?: string[];
}

export type ProblemStatus = "unattempted" | "easy" | "medium" | "hard";

export interface Exam {
  id: string;
  title: string;
  date: string;
  topics_covered: string;
  suggested_problems?: string[];
}

export interface ExamData {
  exams: Exam[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: "completion" | "improvement" | "consistency" | "milestone";
  earned: boolean;
  earnedAt?: string;
}

export interface UserStats {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_problems_solved: number;
  total_attempts: number;
  achievements_earned: string[];
  achievement_history: Array<{
    achievement_id: string;
    timestamp: string;
  }>;
  daily_activity: Record<string, number>;
  topics_completed: string[];
  exams_completed: string[];
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}
