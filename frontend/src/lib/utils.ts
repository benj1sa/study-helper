import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Problem, Topic, ProblemStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProblemStatus(problem: Problem): ProblemStatus {
  if (!problem.history || problem.history.length === 0) {
    return "unattempted";
  }
  const latest = problem.history[problem.history.length - 1];
  return latest.rating;
}

export function getProgressPercentage(topic: Topic): number {
  const total = topic.problems.length;
  if (total === 0) return 0;
  
  // Count problems that have been attempted (any rating)
  const attempted = topic.problems.filter(p => 
    p.history && p.history.length > 0
  ).length;
  
  return (attempted / total) * 100;
}

export function getExamProgressPercentage(topics: Topic[]): number {
  // Aggregate all problems from all topics
  const allProblems = topics.flatMap(topic => topic.problems);
  const total = allProblems.length;
  if (total === 0) return 0;
  
  // Count problems that have been attempted (any rating)
  const attempted = allProblems.filter(p => 
    p.history && p.history.length > 0
  ).length;
  
  return (attempted / total) * 100;
}

export function getTopicMasteryLevel(topic: Topic): 0 | 1 | 2 | 3 {
  // If no problems, return 0
  if (topic.problems.length === 0) return 0;
  
  // Check if all problems have been attempted
  const allAttempted = topic.problems.every(p => 
    p.history && p.history.length > 0
  );
  
  if (!allAttempted) return 0;
  
  // Get latest rating for each problem
  const latestRatings = topic.problems.map(p => {
    if (!p.history || p.history.length === 0) return null;
    return p.history[p.history.length - 1].rating;
  });
  
  // Check if all problems were completed with easy difficulty
  const allEasy = latestRatings.every(rating => rating === "easy");
  if (allEasy) return 3;
  
  // Check if all problems were done below hard difficulty (no hard problems)
  const allBelowHard = latestRatings.every(rating => rating !== "hard");
  if (allBelowHard) return 2;
  
  // All problems were completed (may include hard)
  return 1;
}

export function getExamMasteryLevel(topics: Topic[]): 0 | 1 | 2 | 3 {
  // Aggregate all problems from all topics
  const allProblems = topics.flatMap(topic => topic.problems);
  
  // If no problems, return 0
  if (allProblems.length === 0) return 0;
  
  // Check if all problems have been attempted
  const allAttempted = allProblems.every(p => 
    p.history && p.history.length > 0
  );
  
  if (!allAttempted) return 0;
  
  // Get latest rating for each problem
  const latestRatings = allProblems.map(p => {
    if (!p.history || p.history.length === 0) return null;
    return p.history[p.history.length - 1].rating;
  });
  
  // Check if all problems were completed with easy difficulty
  const allEasy = latestRatings.every(rating => rating === "easy");
  if (allEasy) return 3;
  
  // Check if all problems were done below hard difficulty (no hard problems)
  const allBelowHard = latestRatings.every(rating => rating !== "hard");
  if (allBelowHard) return 2;
  
  // All problems were completed (may include hard)
  return 1;
}

export function formatDaysAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const daysDiff = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return "today";
  if (daysDiff === 1) return "1 day ago";
  return `${daysDiff} days ago`;
}

export function needsReview(problem: Problem): boolean {
  if (!problem.history || problem.history.length === 0) return false;
  
  const latest = problem.history[problem.history.length - 1];
  const daysSince = (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60 * 24);
  
  return latest.rating === "hard" || daysSince > 7;
}

/**
 * Parses a syllabus date string (e.g., "W 2/4", "F 2/6", "T 5/12") to a Date object.
 * Assumes year 2025 for date conversion.
 * Returns null for "TBD" or invalid dates.
 */
export function parseSyllabusDate(dateString: string): Date | null {
  if (dateString === "TBD" || !dateString.trim()) {
    return null;
  }

  // Format: "W 2/4" or "F 2/6" (day abbreviation + month/day)
  const parts = dateString.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  const datePart = parts[1]; // "2/4" or "2/6"
  const [month, day] = datePart.split("/").map(Number);
  
  if (isNaN(month) || isNaN(day)) {
    return null;
  }

  // Assume year 2025
  return new Date(2025, month - 1, day);
}

/**
 * Compares two syllabus dates.
 * Returns negative if date1 < date2, positive if date1 > date2, 0 if equal.
 * "TBD" dates are considered greater than any specific date.
 */
export function compareSyllabusDates(date1: string, date2: string): number {
  const d1 = parseSyllabusDate(date1);
  const d2 = parseSyllabusDate(date2);

  // Handle TBD dates - treat them as "infinity" (always greater)
  if (d1 === null && d2 === null) return 0;
  if (d1 === null) return 1; // TBD is greater
  if (d2 === null) return -1; // TBD is greater

  return d1.getTime() - d2.getTime();
}

/**
 * Checks if date1 is before date2.
 * Returns true if date1 < date2, false otherwise.
 */
export function isDateBefore(date1: string, date2: string): boolean {
  return compareSyllabusDates(date1, date2) < 0;
}

/**
 * Check if a rating represents an improvement over the previous rating.
 * Improvements: hard→medium, hard→easy, medium→easy
 */
export function isRatingImprovement(
  previousRating: ProblemStatus,
  currentRating: ProblemStatus
): boolean {
  if (previousRating === "unattempted") return false;
  if (currentRating === "unattempted") return false;

  // hard → medium or easy is an improvement
  if (previousRating === "hard" && (currentRating === "medium" || currentRating === "easy")) {
    return true;
  }

  // medium → easy is an improvement
  if (previousRating === "medium" && currentRating === "easy") {
    return true;
  }

  return false;
}

/**
 * Get UTC date string (YYYY-MM-DD) from an ISO timestamp.
 */
export function getUTCDateString(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a topic is complete (all problems attempted).
 */
export function isTopicComplete(topic: Topic): boolean {
  if (topic.problems.length === 0) return false;
  return topic.problems.every(
    (p) => p.history && p.history.length > 0
  );
}

/**
 * Check if an exam is complete (all problems in all topics attempted).
 */
export function isExamComplete(topics: Topic[]): boolean {
  if (topics.length === 0) return false;
  return topics.every((topic) => isTopicComplete(topic));
}

/**
 * Get exam progress as a decimal (0.0 to 1.0) for milestone achievements.
 */
export function getExamProgressDecimal(topics: Topic[]): number {
  return getExamProgressPercentage(topics) / 100;
}
