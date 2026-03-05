import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Problem, ProblemStatus, Achievement } from "@/types";
import { getProblemStatus, cn, isRatingImprovement } from "@/lib/utils";
import { logAttempt, getAchievements } from "@/lib/api";
import { triggerConfetti, celebrateAchievement } from "@/lib/confetti";
import { getImprovementMessage } from "@/lib/messages";
import { addAchievementToQueue } from "./AchievementToast";

interface ProblemButtonProps {
  problem: Problem;
  topicId: string;
}

export function ProblemButton({ problem, topicId }: ProblemButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const status = getProblemStatus(problem);

  const mutation = useMutation({
    mutationFn: (rating: "easy" | "medium" | "hard") =>
      logAttempt(topicId, problem.id, rating),
    onMutate: async (rating) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["syllabus"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["syllabus"]);

      // Optimistically update
      queryClient.setQueryData(["syllabus"], (old: any) => {
        if (!old) return old;
        const newData = JSON.parse(JSON.stringify(old));
        const topic = newData.topics.find((t: any) => t.id === topicId);
        if (topic) {
          const prob = topic.problems.find((p: any) => p.id === problem.id);
          if (prob) {
            if (!prob.history) prob.history = [];
            prob.history.push({
              topic_id: topicId,
              problem_id: problem.id,
              rating,
              timestamp: new Date().toISOString(),
            });
          }
        }
        return newData;
      });

      return { previousData, rating };
    },
    onError: (err, rating, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["syllabus"], context.previousData);
      }
    },
    onSuccess: async (response, rating, context) => {
      // Check for improvements
      const previousRating = status;
      const isImprovement = isRatingImprovement(previousRating, rating);

      if (isImprovement) {
        // Show improvement message and enhanced celebration
        const message = getImprovementMessage();
        console.log(message); // Could show as toast/notification
        celebrateAchievement();
      }

      // Handle achievement unlocks
      if (response.achievements_unlocked && response.achievements_unlocked.length > 0) {
        // Fetch achievement details and add to queue
        try {
          const achievements = await getAchievements();
          response.achievements_unlocked.forEach((achievementId: string) => {
            const achievement = achievements.find((a: Achievement) => a.id === achievementId);
            if (achievement) {
              addAchievementToQueue(achievement);
            }
          });
        } catch (error) {
          console.error("Error fetching achievements:", error);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["syllabus"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
    onSettled: () => {
      setOpen(false);
    },
  });

  const handleRatingClick = (
    rating: "easy" | "medium" | "hard",
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // Trigger confetti from the clicked button
    triggerConfetti(event.currentTarget);
    // Proceed with the mutation
    mutation.mutate(rating);
  };

  const getButtonClassName = (status: ProblemStatus): string => {
    switch (status) {
      case "easy":
        return "bg-study-easy";
      case "medium":
        return "bg-study-medium";
      case "hard":
        return "";
      default:
        return "";
    }
  };

  const getButtonVariant = (status: ProblemStatus): "outline" | "destructive" | "default" => {
    switch (status) {
      case "hard":
        return "destructive";
      case "unattempted":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={getButtonVariant(status)}
          className={cn(
            "min-w-[2.5rem]",
            status !== "unattempted" && status !== "hard" && getButtonClassName(status)
          )}
          disabled={mutation.isPending}
        >
          {problem.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-study-easy"
            onClick={(e) => handleRatingClick("easy", e)}
          >
            🟢 Easy
          </Button>
          <Button
            size="sm"
            className="bg-study-medium"
            onClick={(e) => handleRatingClick("medium", e)}
          >
            🟡 Medium
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => handleRatingClick("hard", e)}
          >
            🔴 Hard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
