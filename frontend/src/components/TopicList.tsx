import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getSyllabus, getExamData } from "@/lib/api";
import { isDateBefore, compareSyllabusDates, isTopicComplete } from "@/lib/utils";
import { StudyData, ExamData, Topic, Exam } from "@/types";
import { ExamSection } from "./ExamSection";
import { celebrateAchievement } from "@/lib/confetti";
import { getCompletionMessage } from "@/lib/messages";

export function TopicList() {
  const { data: syllabusData, isLoading: syllabusLoading, error: syllabusError } = useQuery<StudyData>({
    queryKey: ["syllabus"],
    queryFn: getSyllabus,
  });

  const { data: examData, isLoading: examLoading, error: examError } = useQuery<ExamData>({
    queryKey: ["exams"],
    queryFn: getExamData,
  });

  const completedTopicsRef = useRef<Set<string>>(new Set());

  // Detect topic completion and celebrate
  useEffect(() => {
    if (!syllabusData?.topics) return;

    syllabusData.topics.forEach((topic: Topic) => {
      if (isTopicComplete(topic) && !completedTopicsRef.current.has(topic.id)) {
        completedTopicsRef.current.add(topic.id);
        celebrateAchievement();
        const message = getCompletionMessage();
        console.log(`Topic completed: ${topic.name} - ${message}`);
      }
    });
  }, [syllabusData]);

  if (syllabusLoading || examLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading syllabus...</p>
      </div>
    );
  }

  if (syllabusError || examError) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">
          Error loading data: {syllabusError?.message || examError?.message}
        </p>
      </div>
    );
  }

  if (!syllabusData || !syllabusData.topics || syllabusData.topics.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>No topics found. Upload a schedule to get started.</p>
      </div>
    );
  }

  if (!examData || !examData.exams || examData.exams.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>No exam data found.</p>
      </div>
    );
  }

  // Group topics by exam sections
  // Topics with dates before an exam date go in that exam's section
  // Topics do not carry over past an exam
  const groupTopicsByExam = (topics: Topic[], exams: Exam[]): Map<string, Topic[]> => {
    const grouped = new Map<string, Topic[]>();
    
    // Initialize all exam sections with empty arrays
    exams.forEach((exam) => {
      grouped.set(exam.id, []);
    });

    // Find the final exam
    const finalExam = exams.find((exam) => exam.id === "final");
    const regularExams = exams.filter((exam) => exam.id !== "final");

    // Sort regular exams by date (TBD comes first, then by date)
    const sortedRegularExams = [...regularExams].sort((a, b) => {
      if (a.date === "TBD" && b.date !== "TBD") return -1;
      if (a.date !== "TBD" && b.date === "TBD") return 1;
      if (a.date === "TBD" && b.date === "TBD") return 0;
      return compareSyllabusDates(a.date, b.date);
    });

    // Find Exam 1 and Exam 2 for special handling
    const exam1 = exams.find((exam) => exam.id === "exam_1");
    const exam2 = exams.find((exam) => exam.id === "exam_2");

    // Assign topics to exam sections
    topics.forEach((topic) => {
      // Special handling for Exam 1: only gets preliminaries and aggregate method
      if (exam1 && (
        topic.name === "preliminaries" ||
        topic.name === "amortized analysis of cost (aggregate method)"
      )) {
        grouped.get(exam1.id)!.push(topic);
      } else if (exam2 && isDateBefore(topic.date, exam2.date)) {
        // All other topics before Exam 2 go to Exam 2
        grouped.get(exam2.id)!.push(topic);
      } else {
        // For topics after Exam 2, use the normal assignment logic
        // Find the first non-TBD exam that comes after this topic
        let targetExam: Exam | null = null;
        
        for (const exam of sortedRegularExams) {
          if (exam.date !== "TBD" && isDateBefore(topic.date, exam.date)) {
            targetExam = exam;
            break;
          }
        }
        
        if (targetExam) {
          grouped.get(targetExam.id)!.push(topic);
        } else {
          // Topic is after all non-TBD exams, assign to last TBD exam if any
          const lastTbdExam = sortedRegularExams.filter(e => e.date === "TBD").pop();
          if (lastTbdExam) {
            grouped.get(lastTbdExam.id)!.push(topic);
          }
        }
      }

      // All topics also go to the final (cumulative)
      if (finalExam) {
        grouped.get(finalExam.id)!.push(topic);
      }
    });

    return grouped;
  };

  const topicsByExam = groupTopicsByExam(syllabusData.topics, examData.exams);

  // Sort exams to maintain order (Exam 1, Exam 2, ..., Final)
  const sortedExams = [...examData.exams].sort((a, b) => {
    // Final exam always last
    if (a.id === "final") return 1;
    if (b.id === "final") return -1;
    
    // Extract exam numbers for comparison
    const aNum = parseInt(a.id.replace("exam_", "")) || 0;
    const bNum = parseInt(b.id.replace("exam_", "")) || 0;
    return aNum - bNum;
  });

  return (
    <div className="space-y-4">
      {sortedExams.map((exam) => {
        const topics = topicsByExam.get(exam.id) || [];
        return <ExamSection key={exam.id} exam={exam} topics={topics} />;
      })}
    </div>
  );
}
