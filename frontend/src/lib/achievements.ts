/**
 * Achievement utilities and icon mapping.
 */
import {
  Target,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  ArrowUp,
  Zap,
  Flame,
  Calendar,
  Clock,
  Star,
  Award,
  Medal,
  Crown,
  CheckCircle2,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { Achievement } from "@/types";

/**
 * Icon name to Lucide component mapping.
 */
const iconMap: Record<string, LucideIcon> = {
  Target,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  ArrowUp,
  Zap,
  Flame,
  Calendar,
  Clock,
  Star,
  Award,
  Medal,
  Crown,
  CheckCircle2,
  CheckCircle,
};

/**
 * Get the Lucide icon component for an achievement.
 */
export function getAchievementIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Star;
}

/**
 * Group achievements by category.
 */
export function groupAchievementsByCategory(achievements: Achievement[]): Record<string, Achievement[]> {
  const grouped: Record<string, Achievement[]> = {
    completion: [],
    improvement: [],
    consistency: [],
    milestone: [],
  };

  achievements.forEach((achievement) => {
    const category = achievement.category;
    if (grouped[category]) {
      grouped[category].push(achievement);
    }
  });

  return grouped;
}

/**
 * Get category display name.
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    completion: "Completion",
    improvement: "Improvement",
    consistency: "Consistency",
    milestone: "Milestone",
  };
  return names[category] || category;
}

/**
 * Get category color class.
 */
export function getCategoryColorClass(category: string): string {
  const colors: Record<string, string> = {
    completion: "text-blue-500",
    improvement: "text-green-500",
    consistency: "text-orange-500",
    milestone: "text-purple-500",
  };
  return colors[category] || "text-gray-500";
}

/**
 * Get earned achievement count.
 */
export function getEarnedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}

/**
 * Get achievement progress percentage.
 */
export function getAchievementProgress(achievements: Achievement[]): number {
  if (achievements.length === 0) return 0;
  return (getEarnedCount(achievements) / achievements.length) * 100;
}
