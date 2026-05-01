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

// ===== Question generation =====

export interface GenerateQuestionsResponse {
  questions: string[];
  cv_text: string;
  jd_text: string;
}

export const generateQuestions = async (
  cvFile: File,
  jdText: string,
  jdFile: File | null,
  numQuestions: number
): Promise<GenerateQuestionsResponse> => {
  const formData = new FormData();
  formData.append("cv_file", cvFile);

  if (jdFile) {
    formData.append("job_description_file", jdFile);
  } else {
    formData.append("job_description_text", jdText);
  }

  formData.append("num_questions", numQuestions.toString());

  const response = await api.post<GenerateQuestionsResponse>(
    "/generate-questions/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

// ===== API functions =====

export const getUserReports = async (userId: string): Promise<UserReportsResponse> => {
  const response = await api.get<UserReportsResponse>(`/get-user-reports/${userId}`);
  return response.data;
};

export default api;