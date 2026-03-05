import { useState, useEffect, useRef } from "react";
import { ChevronDown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ProblemButton } from "./ProblemButton";
import { PdfDropdown } from "./PdfDropdown";
import { getProgressPercentage, getExamProgressPercentage, getExamMasteryLevel, getTopicMasteryLevel, cn } from "@/lib/utils";
import { Exam, Topic, Problem } from "@/types";
import { celebrateMilestone } from "@/lib/confetti";
import { getProgressMessage } from "@/lib/messages";

interface ExamSectionProps {
  exam: Exam;
  topics: Topic[];
}

export function ExamSection({ exam, topics }: ExamSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previousProgressRef = useRef<number>(0);
  const milestoneReachedRef = useRef<Set<number>>(new Set());

  const examTitle = `${exam.title} - ${exam.date}`;
  const examProgress = topics.length > 0 ? getExamProgressPercentage(topics) : 0;
  const masteryLevel = topics.length > 0 ? getExamMasteryLevel(topics) : 0;

  // Detect milestone achievements (25%, 50%, 75%, 100%)
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const previousProgress = previousProgressRef.current;

    milestones.forEach((milestone) => {
      if (
        examProgress >= milestone &&
        previousProgress < milestone &&
        !milestoneReachedRef.current.has(milestone)
      ) {
        milestoneReachedRef.current.add(milestone);
        celebrateMilestone();
        const message = getProgressMessage(examProgress);
        console.log(`Milestone reached: ${milestone}% - ${message}`);
      }
    });

    previousProgressRef.current = examProgress;
  }, [examProgress]);

  return (
    <div className="border rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors text-left"
        disabled={topics.length === 0}
      >
        <div className="flex items-center gap-4 w-full">
          {topics.length > 0 && (
            <CircularProgress value={examProgress} size={48} className="shrink-0" />
          )}
          <div className="flex flex-col items-start flex-1">
            <div className="text-lg font-semibold">{examTitle}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {exam.topics_covered}
            </div>
          </div>
        </div>
        {topics.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((level) => (
                masteryLevel >= level ? (
                  <Star key={level} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <Star key={level} className="h-4 w-4 text-muted-foreground" />
                )
              ))}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        )}
      </button>
      {isOpen && topics.length > 0 && (
        <div className="space-y-6 px-6 pb-6 pt-2">
          {topics.map((topic) => {
            const progress = getProgressPercentage(topic);
            const masteryLevel = getTopicMasteryLevel(topic);
            return (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {topic.name}{" "}
                      <span className="text-muted-foreground text-lg font-normal">
                        ({topic.date})
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((level) => (
                          masteryLevel >= level ? (
                            <Star key={level} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <Star key={level} className="h-4 w-4 text-muted-foreground" />
                          )
                        ))}
                      </div>
                      <PdfDropdown topicName={topic.name} />
                    </div>
                  </div>
                  <Progress value={progress} className="mt-2 [&>div]:bg-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {topic.problems.map((problem: Problem) => (
                      <ProblemButton
                        key={problem.id}
                        problem={problem}
                        topicId={topic.id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
