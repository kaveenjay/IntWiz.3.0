import axios from "axios";

// Backend URL — change this when you deploy
const API_BASE_URL = "http://127.0.0.1:8000";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (audio analysis can take time)
});

// ===== Type definitions =====

export interface InterviewSummary {
  report_id: string;
  timestamp: string;
  overall_score: number;
  dominant_emotion: string;
  question_count: number;
  mode: string;
  ai_summary: string;
  average_relevance: number;
  average_fluency: number;
  average_technical_depth: number;
}

export interface UserReportsResponse {
  user_id: string;
  report_count: number;
  reports: InterviewSummary[];
}

// ===== API functions =====

export const getUserReports = async (userId: string): Promise<UserReportsResponse> => {
  const response = await api.get<UserReportsResponse>(`/get-user-reports/${userId}`);
  return response.data;
};

export default api;