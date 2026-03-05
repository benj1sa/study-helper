import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAchievements } from "@/lib/api";
import {
  getAchievementIcon,
  groupAchievementsByCategory,
  getCategoryDisplayName,
  getCategoryColorClass,
  getEarnedCount,
  getAchievementProgress,
} from "@/lib/achievements";
import { Achievement } from "@/types";
import { Trophy, Filter } from "lucide-react";

export function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading achievements...</p>
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>No achievements found.</p>
      </div>
    );
  }

  const earnedCount = getEarnedCount(achievements);
  const progress = getAchievementProgress(achievements);
  const grouped = groupAchievementsByCategory(achievements);

  // Filter achievements by category
  const filteredAchievements =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const categories = ["all", "completion", "improvement", "consistency", "milestone"];

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Achievements</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {earnedCount} / {achievements.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {progress.toFixed(0)}% Complete
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === "all" ? "All" : getCategoryDisplayName(category)}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const Icon = getAchievementIcon(achievement.icon_name);
          const isEarned = achievement.earned;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                isEarned
                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-4 rounded-full ${
                      isEarned ? "bg-yellow-100" : "bg-gray-200"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${
                        isEarned ? "text-yellow-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg ${
                        isEarned ? "text-yellow-900" : "text-gray-600"
                      }`}
                    >
                      {achievement.name}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isEarned ? "text-yellow-800" : "text-gray-500"
                      }`}
                    >
                      {achievement.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getCategoryColorClass(achievement.category)}
                    >
                      {getCategoryDisplayName(achievement.category)}
                    </Badge>
                    {isEarned && (
                      <Badge variant="default" className="bg-yellow-500">
                        Earned
                      </Badge>
                    )}
                  </div>
                  {isEarned && achievement.earnedAt && (
                    <p className="text-xs text-muted-foreground">
                      Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No achievements in this category.
        </div>
      )}
    </div>
  );
}
