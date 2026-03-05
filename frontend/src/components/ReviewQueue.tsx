import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProblemButton } from "./ProblemButton";
import { getSyllabus } from "@/lib/api";
import { needsReview, formatDaysAgo } from "@/lib/utils";
import { StudyData, Problem, Topic } from "@/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { getCompletionMessage } from "@/lib/messages";

interface ReviewItem {
  problem: Problem;
  topic: Topic;
}

export function ReviewQueue() {
  const { data, isLoading, error } = useQuery<StudyData>({
    queryKey: ["syllabus"],
    queryFn: getSyllabus,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading review queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Error loading review queue: {error.message}</p>
      </div>
    );
  }

  if (!data || !data.topics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No syllabus data available. Upload a schedule to get started.
        </AlertDescription>
      </Alert>
    );
  }

  // Collect all problems that need review
  const reviewItems: ReviewItem[] = [];
  data.topics.forEach((topic) => {
    topic.problems.forEach((problem) => {
      if (needsReview(problem)) {
        reviewItems.push({ problem, topic });
      }
    });
  });

  if (reviewItems.length === 0) {
    const encouragementMessage = getCompletionMessage();
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">All caught up!</AlertTitle>
        <AlertDescription className="text-green-800">
          {encouragementMessage} There are no problems in your review queue. Keep up the great work!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 pr-4">
        {reviewItems.map(({ problem, topic }) => {
          const latest = problem.history[problem.history.length - 1];
          const daysAgo = formatDaysAgo(latest.timestamp);
          return (
            <Card key={`${topic.id}-${problem.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {topic.name}: Problem {problem.label}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    Last: {latest.rating} ({daysAgo})
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <ProblemButton problem={problem} topicId={topic.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
