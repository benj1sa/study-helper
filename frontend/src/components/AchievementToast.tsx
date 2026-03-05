import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAchievementIcon } from "@/lib/achievements";
import { celebrateAchievement } from "@/lib/confetti";
import { Achievement } from "@/types";
import { X } from "lucide-react";

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

function AchievementToastItem({ achievement, onDismiss }: AchievementToastProps) {
  const Icon = getAchievementIcon(achievement.icon_name);

  useEffect(() => {
    // Trigger confetti when toast appears
    celebrateAchievement();
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 animate-in slide-in-from-right">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-yellow-900">
              Achievement Unlocked!
            </h3>
            <p className="font-medium text-sm text-yellow-800 mt-1">
              {achievement.name}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {achievement.description}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Global queue manager
let achievementQueue: Achievement[] = [];
let currentToast: Achievement | null = null;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function addAchievementToQueue(achievement: Achievement) {
  achievementQueue.push(achievement);
  if (!currentToast) {
    processQueue();
  }
  notifyListeners();
}

function processQueue() {
  if (achievementQueue.length > 0 && !currentToast) {
    currentToast = achievementQueue.shift() || null;
    notifyListeners();
  }
}

function dismissCurrentToast() {
  currentToast = null;
  notifyListeners();
  // Process next in queue after a short delay
  setTimeout(() => {
    processQueue();
  }, 300);
}

/**
 * AchievementToast component that displays achievements in a queue.
 * Shows one achievement at a time.
 */
export function AchievementToast() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => {
      forceUpdate({});
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!currentToast) {
    return null;
  }

  return (
    <AchievementToastItem
      achievement={currentToast}
      onDismiss={dismissCurrentToast}
    />
  );
}
