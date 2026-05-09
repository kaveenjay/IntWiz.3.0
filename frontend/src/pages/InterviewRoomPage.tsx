import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import {
  analyzeAudio,
  generateNextQuestion,
  saveReport,
} from "../services/api";
import type {
  AudioAnalysisResponse,
  ConversationHistoryItem,
} from "../services/api";

// ===== Type definitions =====

interface InterviewConfig {
  interviewId: string;
  cvText: string;
  jdText: string;
  mode: "adaptive" | "fixed";
  targetQuestions: number;
  saveAudio: boolean;
  firstQuestion: string;
  startedAt: string;
}

interface AnswerResult {
  question: string;
  transcript: string;
  scores: AudioAnalysisResponse["data"];
}

type InterviewPhase = "idle" | "recording" | "analyzing" | "fetching-next" | "saving-report" | "error";

function InterviewRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRecording, duration, audioBlob, error: recorderError, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  // ===== State =====
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [history, setHistory] = useState<AnswerResult[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [analyzeError, setAnalyzeError] = useState("");

  // Scroll chat to bottom after new messages
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ===== Load config from sessionStorage on mount =====
  useEffect(() => {
    const stored = sessionStorage.getItem("intwiz_interview");

    if (!stored) {
      navigate("/interview/setup");
      return;
    }

    try {
      const parsed: InterviewConfig = JSON.parse(stored);
      setConfig(parsed);
      setCurrentQuestion(parsed.firstQuestion);
    } catch (err) {
      console.error("Failed to parse interview config:", err);
      navigate("/interview/setup");
    }
  }, [navigate]);

  // ===== Sync question number with history length =====
  useEffect(() => {
    setQuestionNumber(history.length + 1);
  }, [history.length]);

  // ===== Scroll to bottom when history changes =====
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentQuestion]);

  // ===== Auto-submit when audioBlob is ready =====
  useEffect(() => {
    if (!audioBlob || !config || !user) return;

    const analyzeAndContinue = async () => {
      setPhase("analyzing");
      setAnalyzeError("");

      try {
        // Step 1: Analyze the audio
        const analyzeResponse = await analyzeAudio(audioBlob, {
          cvText: config.cvText,
          jdText: config.jdText,
          question: currentQuestion,
          saveAudio: config.saveAudio,
          userId: user.uid,
          interviewId: config.interviewId,
          questionNumber: questionNumber,
        });

        // Build the new history entry
        const newEntry: AnswerResult = {
          question: currentQuestion,
          transcript: analyzeResponse.data.transcript,
          scores: analyzeResponse.data,
        };

        const updatedHistory = [...history, newEntry];
        setHistory(updatedHistory);

        // Reset recorder for next answer
        resetRecording();

        // Step 2: Fetch next question
        setPhase("fetching-next");

        // Convert history to format expected by backend
        const conversationHistory: ConversationHistoryItem[] = updatedHistory.map((entry) => ({
          question: entry.question,
          transcript: entry.transcript,
          relevance_score: entry.scores.relevance_score,
          fluency_score: entry.scores.fluency_score,
          star_score: entry.scores.star_analysis.star_score,
          technical_depth_score: entry.scores.technical_depth_score,
          overall_score: Math.round(
            (entry.scores.relevance_score +
              entry.scores.fluency_score +
              entry.scores.star_analysis.star_score +
              entry.scores.technical_depth_score) / 4
          ),
        }));

        const nextResponse = await generateNextQuestion(
          config.cvText,
          config.jdText,
          conversationHistory,
          updatedHistory.length,
          config.mode === "fixed" ? config.targetQuestions : 0
        );

        if (nextResponse.should_continue && nextResponse.question) {
          // Continue: display next question, back to idle
          setCurrentQuestion(nextResponse.question);
          setPhase("idle");
        } else {
          // End: don't update currentQuestion, just save and navigate
          await endInterview(updatedHistory);
        }
      } catch (err: any) {
        console.error("Flow failed:", err);
        setAnalyzeError(
          err.response?.status === 500
            ? "Server error. Please try recording again."
            : "Couldn't process your answer. Please check your connection and try again."
        );
        setPhase("error");
        resetRecording();
      }
    };

    analyzeAndContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  // ===== Derive chat messages from history =====
  const messages = history.flatMap((entry, idx) => [
    { id: `q-${idx}`, role: "ai" as const, content: entry.question },
    { id: `a-${idx}`, role: "user" as const, content: entry.transcript },
  ]);

  // ===== Loading state =====
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-frame">
        <div className="text-center">
          <div className="font-display text-5xl mb-4">
            Int<em className="italic text-accent">Wiz</em>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            — Loading
          </div>
        </div>
      </div>
    );
  }

  // ===== Save report and navigate to results =====
  const endInterview = async (finalHistory: AnswerResult[]) => {
    if (!config || !user) return;

    // Set the saving phase immediately so the UI renders before the async work begins
    setPhase("saving-report");

    // Ensures the "wrapping up" UI is visible for at least 800ms
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const interviewResults = finalHistory.map((entry) => ({
        question: entry.question,
        transcript: entry.transcript,
        detected_tone: entry.scores.detected_tone,
        confidence_score: entry.scores.confidence_score,
        engagement_score: entry.scores.engagement_score,
        duration_seconds: entry.scores.duration_seconds,
        wpm: entry.scores.wpm,
        filler_word_count: entry.scores.filler_word_count,
        fluency_score: entry.scores.fluency_score,
        pacing_score: entry.scores.pacing_score,
        pause_quality_score: entry.scores.pause_quality_score,
        relevance_score: entry.scores.relevance_score,
        technical_depth_score: entry.scores.technical_depth_score,
        star_analysis: entry.scores.star_analysis,
        audio_url: entry.scores.audio_url,
      }));

      // Run save and minimum delay in parallel — actual save isn't slowed down
      const [reportResponse] = await Promise.all([
        saveReport(
          user.uid,
          config.cvText,
          config.jdText,
          interviewResults,
          config.targetQuestions
        ),
        minDelay,
      ]);

      // Clear sessionStorage now that interview is saved
      sessionStorage.removeItem("intwiz_interview");

      navigate(`/results/${reportResponse.report_id}`);
    } catch (err: any) {
      console.error("Failed to save report:", err);
      setAnalyzeError(
        "Couldn't save your interview. Your progress is preserved — please try ending the interview again."
      );
      setPhase("error");
    }
  };

  // ===== End interview handler (manual) =====
  const handleEndInterview = () => {
    const message =
      history.length === 0
        ? "End the interview? You haven't answered any questions yet."
        : `End the interview? Your results will be calculated based on the ${history.length} question${history.length === 1 ? "" : "s"} you've answered.`;

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    if (history.length === 0) {
      sessionStorage.removeItem("intwiz_interview");
      navigate("/dashboard");
    } else {
      endInterview(history);
    }
  };

  // ===== Calculate progress =====
  const totalEstimate = config.mode === "fixed" ? config.targetQuestions : 8;
  const progressPercent = Math.min((questionNumber / totalEstimate) * 100, 100);

  // ===== User initials for avatar =====
  const userInitial = user?.email?.[0]?.toUpperCase() ?? "U";

  // ===== Phases that block user interaction =====
  const isBusy = phase === "analyzing" || phase === "fetching-next" || phase === "saving-report";

  // ===== Main UI =====
  return (
    <div className="h-screen overflow-hidden bg-frame flex flex-col lg:grid lg:grid-cols-[360px_1fr]">

      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="bg-soft border-t lg:border-t-0 lg:border-r border-line p-4 lg:p-8 flex flex-col order-2 lg:order-1 lg:h-screen overflow-y-auto">

        {/* Eyebrow */}
        <div className="hidden lg:block font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">
          — In progress
        </div>

        {/* Question count */}
        <div className="hidden lg:block font-display text-5xl leading-none mb-1">
          {String(questionNumber).padStart(2, "0")}
          <em className="italic text-accent text-3xl"> of {config.mode === "fixed" ? config.targetQuestions : "~8"}</em>
        </div>

        {/* Progress label */}
        <div className="hidden lg:flex justify-between items-center mt-8 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            Progress
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            ≈ {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="hidden lg:block h-1 bg-line relative mb-8">
          <div
            className="absolute inset-y-0 left-0 bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mode indicator */}
        <div className="hidden lg:block border-t border-line pt-6 mb-auto">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
            — Mode
          </div>
          <div className="font-display text-xl">
            {config.mode === "adaptive" ? (
              <>Adaptive <em className="italic text-accent text-sm">· AI decides</em></>
            ) : (
              <>Fixed <em className="italic text-accent text-sm">· {config.targetQuestions} questions</em></>
            )}
          </div>
        </div>

        {/* Audio storage indicator */}
        {config.saveAudio && (
          <div className="hidden lg:block border-t border-line pt-6 mb-6">
            <div className={`font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 ${
              isRecording ? "text-warn" : "text-ink-faint"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isRecording ? "bg-warn animate-pulse" : "bg-ink-faint"
              }`}></span>
              {isRecording ? "Recording in progress" : "Audio recording enabled"}
            </div>
            <div className="text-xs text-ink-soft mt-1">
              Auto-deleted after 30 days
            </div>
          </div>
        )}

        {/* ===== Recording controls ===== */}
        <div className="border border-line-strong">
          {isRecording ? (
            /* Recording state */
            <div className="p-4 lg:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-2 h-2 bg-warn rounded-full animate-pulse"></span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-warn">
                  Recording
                </span>
              </div>
              <div className="font-display text-3xl lg:text-4xl mb-4">
                {formatDuration(duration)}
              </div>
              <button
                onClick={stopRecording}
                className="w-full py-3 bg-warn text-page font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Stop & Analyze
              </button>
            </div>
          ) : phase === "analyzing" ? (
            /* Analyzing state */
            <div className="p-4 lg:p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                — Analyzing your answer
              </div>
              <div className="space-y-2">
                <div className="h-1 bg-line animate-pulse"></div>
                <div className="h-1 bg-line animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-1 bg-line animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          ) : phase === "fetching-next" ? (
            /* Fetching next question */
            <div className="p-4 lg:p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                — Preparing next question
              </div>
              <div className="space-y-2">
                <div className="h-1 bg-line animate-pulse"></div>
                <div className="h-1 bg-line animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-1 bg-line animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          ) : phase === "saving-report" ? (
            /* Saving report */
            <div className="p-4 lg:p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                Wrapping up
              </div>
              <div className="text-xs text-ink-soft mb-4">
                Saving your interview report
              </div>
              <div className="space-y-2">
                <div className="h-1 bg-accent/30 animate-pulse"></div>
                <div className="h-1 bg-accent/30 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-1 bg-accent/30 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          ) : phase === "error" ? (
            /* Error state */
            <div className="p-4 lg:p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-warn mb-3">
                — Something went wrong
              </div>
              <div className="text-xs text-ink-soft mb-4">
                {analyzeError}
              </div>
              <button
                onClick={() => {
                  setPhase("idle");
                  setAnalyzeError("");
                }}
                className="w-full py-3 border border-line-strong text-ink font-mono text-xs uppercase tracking-widest hover:bg-soft transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Idle / ready state (default) */
            <div className="p-4 lg:p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-4">
                — Ready to answer
              </div>
              <button
                onClick={startRecording}
                className="w-full py-3 bg-ink text-page font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Start Recording
              </button>
              {recorderError && (
                <p className="text-xs text-warn leading-relaxed mt-3">
                  {recorderError}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ===== RIGHT MAIN AREA ===== */}
      <main className="flex flex-col flex-1 min-h-0 order-1 lg:order-2 overflow-hidden lg:h-screen">

        {/* Top bar with End Interview button */}
        <div className="border-b border-line px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 flex justify-between items-center">
          <h2 className="font-display text-lg sm:text-2xl">
            Question <em className="italic text-accent">{numberToWord(questionNumber)}</em>
          </h2>
          <button
            onClick={handleEndInterview}
            disabled={isBusy}
            className="border border-warn text-warn px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-[11px] uppercase tracking-widest hover:bg-warn hover:text-page transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">End Interview Now</span>
            <span className="sm:hidden">End</span>
          </button>
        </div>

        {/* Chat conversation area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-8 lg:py-10 space-y-6">

          {/* Previous Q&A messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center font-display italic text-lg ${
                  msg.role === "ai"
                    ? "bg-accent text-page"
                    : "bg-tint text-ink"
                }`}
              >
                {msg.role === "ai" ? "A" : userInitial}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[90%] lg:max-w-2xl px-4 sm:px-5 py-3 sm:py-4 rounded text-sm sm:text-base leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-accent-bg border-l-2 border-accent"
                    : "bg-soft border-r-2 border-ink"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Current question (highlighted) — only shown when there's a question to answer */}
          {currentQuestion && (
            <div className="flex gap-3 sm:gap-4 pt-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent text-page flex-shrink-0 flex items-center justify-center font-display italic text-lg">
                A
              </div>
              <div className="max-w-[90%] lg:max-w-2xl px-4 sm:px-5 py-3 sm:py-4 bg-frame border-2 border-accent rounded shadow-lg">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2 font-semibold">
                  — Current question
                </div>
                <div className="text-base leading-relaxed">
                  {currentQuestion}
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={chatEndRef} />
        </div>
      </main>
    </div>
  );
}

// ===== Helpers =====

function numberToWord(num: number): string {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "eleven", "twelve",
  ];
  return words[num] || num.toString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default InterviewRoomPage;
