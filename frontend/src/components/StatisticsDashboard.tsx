import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserStats, getAchievements, getSyllabus } from "@/lib/api";
import { Flame, Target, BookOpen, Trophy } from "lucide-react";
import { getUTCDateString } from "@/lib/utils";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4ECDC4", "#FFD700", "#FF6B6B"];

export function StatisticsDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getUserStats,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
  });

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ["syllabus"],
    queryFn: getSyllabus,
  });

  if (statsLoading || achievementsLoading || studyLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading statistics...</p>
      </div>
    );
  }

  // Prepare daily activity data for chart
  const activityData = Object.entries(stats.daily_activity)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // Last 30 days
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      problems: count,
    }));

  // Calculate difficulty distribution
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  if (studyData) {
    studyData.topics.forEach((topic) => {
      topic.problems.forEach((problem) => {
        if (problem.history && problem.history.length > 0) {
          const latest = problem.history[problem.history.length - 1];
          if (latest.rating === "easy") easyCount++;
          else if (latest.rating === "medium") mediumCount++;
          else if (latest.rating === "hard") hardCount++;
        }
      });
    });
  }

  const difficultyData = [
    { name: "Easy", value: easyCount },
    { name: "Medium", value: mediumCount },
    { name: "Hard", value: hardCount },
  ].filter((item) => item.value > 0);

  // Recent achievements timeline
  const recentAchievements = achievements
    ?.filter((a) => a.earned)
    .sort((a, b) => {
      const aTime = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
      const bTime = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_attempts}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.current_streak}</div>
            <p className="text-xs text-muted-foreground">
              Longest: {stats.longest_streak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topics_completed.length}</div>
            <p className="text-xs text-muted-foreground">Out of {studyData?.topics.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements?.filter((a) => a.earned).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {achievements?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="problems"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  name="Problems"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-50 border-yellow-200"
                >
                  <div className="flex-shrink-0">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earnedAt && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No achievements earned yet. Keep studying!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
