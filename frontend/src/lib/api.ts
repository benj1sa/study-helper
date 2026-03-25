import axios from "axios";
import { StudyData, AttemptRequest, AttemptResponse, ExamData, UserStats, Achievement, StreakInfo } from "@/types";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getSyllabus(): Promise<StudyData> {
  const response = await api.get<StudyData>("/api/syllabus");
  return response.data;
}

export async function logAttempt(
  topicId: string,
  problemId: string,
  rating: "easy" | "medium" | "hard"
): Promise<AttemptResponse> {
  const payload: AttemptRequest = {
    topic_id: topicId,
    problem_id: problemId,
    rating,
    timestamp: new Date().toISOString(),
  };
  const response = await api.post<AttemptResponse>("/api/attempt", payload);
  return response.data;
}

export async function uploadSchedule(file: File): Promise<StudyData> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post<StudyData>("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function saveSchedule(data: StudyData): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/api/upload/save", data);
  return response.data;
}

export async function getExamData(): Promise<ExamData> {
  const response = await api.get<ExamData>("/api/exams");
  return response.data;
}

export async function getUserStats(): Promise<UserStats> {
  const response = await api.get<UserStats>("/api/stats");
  return response.data;
}

export async function getAchievements(): Promise<Achievement[]> {
  const response = await api.get<Achievement[]>("/api/achievements");
  return response.data;
}

export async function getStreakInfo(): Promise<StreakInfo> {
  const response = await api.get<StreakInfo>("/api/streak");
  return response.data;
}
