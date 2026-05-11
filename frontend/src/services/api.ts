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

// ===== Audio analysis =====

export interface AudioAnalysisResponse {
  filename: string;
  status: string;
  data: {
    detected_tone: string;
    confidence_score: number;
    engagement_score: number;
    transcript: string;
    duration_seconds: number;
    wpm: number;
    filler_word_count: number;
    filler_words_detected: string[];
    fluency_score: number;
    pacing_score: number;
    duration_assessment: string;
    word_count_assessment: string;
    pause_count: number;
    average_pause_duration: number;
    pause_quality_score: number;
    technical_terms_found: string[];
    technical_term_count: number;
    technical_depth_score: number;
    relevant_terms_extracted: string[];
    relevance_score: number;
    star_analysis: {
      star_score: number;
      star_feedback: string;
      has_situation: boolean;
      has_action: boolean;
      has_result: boolean;
    };
    audio_saved: boolean;
    audio_url: string | null;
  };
}

export const analyzeAudio = async (
  audioBlob: Blob,
  options: {
    cvText: string;
    jdText: string;
    question: string;
    saveAudio: boolean;
    userId: string;
    interviewId: string;
    questionNumber: number;
  }
): Promise<AudioAnalysisResponse> => {
  const formData = new FormData();
  formData.append("file", audioBlob, "answer.webm");
  formData.append("cv_text", options.cvText);
  formData.append("job_description_text", options.jdText);
  formData.append("question", options.question);
  formData.append("save_audio", options.saveAudio ? "true" : "false");
  formData.append("user_id", options.userId);
  formData.append("interview_id", options.interviewId);
  formData.append("question_number", options.questionNumber.toString());

  const response = await api.post<AudioAnalysisResponse>(
    "/analyze-audio/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // 60s — audio analysis can take a while
    }
  );

  return response.data;
};

// ===== Adaptive question generation =====

export interface NextQuestionResponse {
  question: string | null;
  should_continue: boolean;
  question_number: number;
  reasoning: string;
}

export interface ConversationHistoryItem {
  question: string;
  transcript: string;
  relevance_score: number;
  fluency_score: number;
  star_score: number;
  technical_depth_score: number;
  overall_score: number;
}

export const generateNextQuestion = async (
  cvText: string,
  jdText: string,
  conversationHistory: ConversationHistoryItem[],
  currentQuestionCount: number,
  targetQuestions: number
): Promise<NextQuestionResponse> => {
  const formData = new FormData();
  formData.append("cv_text", cvText);
  formData.append("job_description_text", jdText);
  formData.append("conversation_history", JSON.stringify(conversationHistory));
  formData.append("current_question_count", currentQuestionCount.toString());
  formData.append("target_questions", targetQuestions.toString());

  const response = await api.post<NextQuestionResponse>(
    "/generate-next-question/",
    formData
  );

  return response.data;
};

// ===== Save report =====

export interface SaveReportResponse {
  report_id: string;
  status: string;
  overall_score: number;
  ai_summary: string;
}

export const saveReport = async (
  userId: string,
  cvText: string,
  jdText: string,
  interviewResults: QuestionResult[],
  targetQuestions: number
): Promise<SaveReportResponse> => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("cv_text", cvText);
  formData.append("jd_text", jdText);
  formData.append("interview_results", JSON.stringify(interviewResults));
  formData.append("target_questions", targetQuestions.toString());

  const response = await api.post<SaveReportResponse>("/save-report/", formData);
  return response.data;
};

// ===== Get full report =====

export interface QuestionResult {
  question: string;
  transcript: string;
  detected_tone: string;
  confidence_score: number;
  engagement_score: number;
  duration_seconds: number;
  wpm: number;
  filler_word_count: number;
  fluency_score: number;
  pacing_score: number;
  pause_quality_score: number;
  relevance_score: number;
  technical_depth_score: number;
  star_analysis: {
    star_score: number;
    star_feedback: string;
    has_situation: boolean;
    has_action: boolean;
    has_result: boolean;
  };
  audio_url: string | null;
}

export interface FullReport {
  report_id: string;
  user_id: string;
  timestamp: string;
  overall_score: number;
  dominant_emotion: string;
  ai_summary: string;
  question_count: number;
  target_questions: number;
  mode: string;
  average_relevance: number;
  average_fluency: number;
  average_technical_depth: number;
  average_pacing: number;
  average_pause_quality: number;
  average_star: number;
  total_filler_words: number;
  interview_results: QuestionResult[];
  cv_text: string;
  jd_text: string;
}

export const getReport = async (reportId: string): Promise<FullReport> => {
  const response = await api.get<FullReport>(`/get-report/${reportId}`);
  return response.data;
};

export const getUserReports = async (userId: string): Promise<UserReportsResponse> => {
  const response = await api.get<UserReportsResponse>(`/get-user-reports/${userId}`);
  return response.data;
};

export const deleteReport = async (
  reportId: string,
  userId: string
): Promise<{ report_id: string; status: string; audio_files_deleted: number }> => {
  const response = await api.delete(`/delete-report/${reportId}`, {
    params: { user_id: userId },
  });
  return response.data;
};

// ===== User preferences =====

export interface UserPreferences {
  defaultMode: "adaptive" | "fixed";
  defaultTargetQuestions: number;
  defaultSaveAudio: boolean;
}

export interface PreferencesResponse {
  user_id: string;
  preferences: UserPreferences;
  is_default: boolean;
}

export const getPreferences = async (userId: string): Promise<PreferencesResponse> => {
  const response = await api.get<PreferencesResponse>(`/get-preferences/${userId}`);
  return response.data;
};

export const savePreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<{ user_id: string; status: string; preferences: UserPreferences }> => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("default_mode", preferences.defaultMode);
  formData.append("default_target_questions", preferences.defaultTargetQuestions.toString());
  formData.append("default_save_audio", preferences.defaultSaveAudio.toString());

  const response = await api.post("/save-preferences/", formData);
  return response.data;
};

export default api;