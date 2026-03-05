import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicList } from "./TopicList";
import { ReviewQueue } from "./ReviewQueue";
import { UploadView } from "./UploadView";
import { StatsWidget } from "./StatsWidget";
import { StatisticsDashboard } from "./StatisticsDashboard";
import { AchievementsPage } from "./AchievementsPage";
import { AchievementToast } from "./AchievementToast";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">CMSC420 Study Tracker</h1>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="review">Review Queue</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="upload">Add Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <StatsWidget />
            <TopicList />
          </TabsContent>
          <TabsContent value="review" className="mt-6">
            <ReviewQueue />
          </TabsContent>
          <TabsContent value="statistics" className="mt-6">
            <StatisticsDashboard />
          </TabsContent>
          <TabsContent value="achievements" className="mt-6">
            <AchievementsPage />
          </TabsContent>
          <TabsContent value="upload" className="mt-6">
            <UploadView />
          </TabsContent>
        </Tabs>
        <AchievementToast />
      </div>
    </div>
  );
}
