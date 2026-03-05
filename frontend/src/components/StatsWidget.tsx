import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserStats, getAchievements } from "@/lib/api";
import { Flame, Target, Trophy, Award } from "lucide-react";
import { getUTCDateString } from "@/lib/utils";

export function StatsWidget() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getUserStats,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
  });

  if (statsLoading || achievementsLoading || !stats) {
    return null;
  }

  // Get recent achievements (last 3-5)
  const recentAchievements = achievements
    ?.filter((a) => a.earned)
    .sort((a, b) => {
      const aTime = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
      const bTime = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5) || [];

  // Calculate today's problems
  const today = getUTCDateString(new Date().toISOString());
  const todayCount = stats.daily_activity[today] || 0;

  // Calculate this week's progress
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = getUTCDateString(weekAgo.toISOString());
  const thisWeekCount = Object.entries(stats.daily_activity)
    .filter(([date]) => date >= weekStart)
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Streak */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.current_streak}</span>
            </div>
            <span className="text-xs text-muted-foreground">Day Streak</span>
          </div>

          {/* Total Problems */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.total_attempts}</span>
            </div>
            <span className="text-xs text-muted-foreground">Total Attempts</span>
          </div>

          {/* Today's Problems */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{todayCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>

          {/* This Week */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{thisWeekCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Recent Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentAchievements.slice(0, 3).map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant="outline"
                  className="bg-yellow-50 border-yellow-300 text-yellow-800"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {achievement.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
