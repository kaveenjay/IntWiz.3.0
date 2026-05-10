import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { getReport, deleteReport } from "../services/api";
import type { FullReport } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import generateReportPDF from "../utils/generateReportPDF";
import MetricTooltip from "../components/MetricTooltip";

function ResultsPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animatedScore, setAnimatedScore] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!reportId) {
      navigate("/dashboard");
      return;
    }

    const fetchReport = async () => {
      try {
        const data = await getReport(reportId);
        setReport(data);
      } catch (err: any) {
        console.error("Failed to fetch report:", err);
        setError("Couldn't load your interview report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, navigate]);

  useEffect(() => {
    if (report) {
      // Slight delay so the ring renders at 0 first, then animates to the real score
      const timer = setTimeout(() => {
        setAnimatedScore(report.overall_score);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [report]);

  // ===== LOADING STATE =====
  if (loading) {
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

  // ===== ERROR STATE =====
  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-frame px-12">
        <div className="text-center max-w-md">
          <div className="font-mono text-xs uppercase tracking-widest text-warn mb-4">
            — Something went wrong
          </div>
          <h1 className="font-display text-5xl mb-4">
            Couldn't load <em className="italic text-accent">report</em>
          </h1>
          <p className="text-ink-soft mb-8">
            {error || "The report you're looking for doesn't exist or couldn't be retrieved."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-ink text-page px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ===== HELPER FUNCTIONS =====

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference * (1 - animatedScore / 100);

  const getScoreTagline = (score: number): string => {
    if (score >= 85) return "Excellent performance";
    if (score >= 75) return "Strong performance";
    if (score >= 65) return "Solid foundation";
    if (score >= 50) return "Good start, room to grow";
    return "Plenty to work on";
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculatePerQuestionScore = (q: any): number => {
    return Math.round(
      q.relevance_score * 0.25 +
      q.technical_depth_score * 0.20 +
      q.star_analysis.star_score * 0.15 +
      q.fluency_score * 0.15 +
      q.pacing_score * 0.10 +
      q.pause_quality_score * 0.08 +
      q.confidence_score * 0.07
    );
  };

  const toRoman = (num: number): string => {
    const numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];
    return numerals[num - 1] || num.toString();
  };

  const handleDelete = async () => {
    if (!user?.uid || !report) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteReport(report.report_id, user.uid);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 403) {
        setDeleteError("You don't have permission to delete this report.");
      } else if (err.response?.status === 404) {
        setDeleteError("This report no longer exists.");
      } else {
        setDeleteError("Couldn't delete the report. Please try again.");
      }
      setDeleting(false);
    }
  };

  // ===== MAIN UI =====
  return (
    <div className="min-h-screen bg-frame">

      <TopNav />

      {/* ACTION BAR */}
      <div className="border-b border-line px-4 sm:px-8 lg:px-12 py-3 flex justify-end items-center gap-2 sm:gap-3 bg-frame">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="border border-line-strong px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-warn hover:border-warn transition-colors"
        >
          Delete Report
        </button>
        <button
          onClick={() => generateReportPDF(report)}
          className="bg-ink text-page px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-2"
        >
          <span className="font-display italic text-base">↓</span>
          Download PDF
        </button>
      </div>

      {/* HERO SECTION */}
      <div className="bg-soft border-b border-line py-10 sm:py-20 px-6 sm:px-12 text-center">

        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          — Session complete · {formatDate(report.timestamp)}
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none mb-8 sm:mb-12">
          Your <em className="italic text-accent">results</em>.
        </h1>

        {/* CIRCULAR SCORE RING */}
        <div className="inline-block relative w-40 sm:w-48 lg:w-[240px] mb-6 sm:mb-8">
          <svg viewBox="0 0 240 240" className="-rotate-90 w-full h-full">
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#D4CCBA"
              strokeWidth="8"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#2D4A3E"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={scoreOffset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>

          {/* Score number overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-5xl sm:text-7xl lg:text-8xl leading-none text-ink">
              {Math.round(report.overall_score)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mt-2">
              — out of 100
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="font-display text-2xl sm:text-3xl italic text-accent">
          {getScoreTagline(report.overall_score)}.
        </div>
      </div>

      {/* AI SUMMARY CARD */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-16">
        <div className="bg-accent-bg border-l-2 border-accent p-6 sm:p-10 relative">
          <div className="absolute -top-5 left-8 font-display italic text-7xl text-accent leading-none">
            "
          </div>

          <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3 mt-3">
            — AI-generated summary
          </div>

          <div className="font-display text-xl sm:text-2xl leading-relaxed text-ink">
            {report.ai_summary}
          </div>
        </div>
      </div>

      {/* PERFORMANCE BREAKDOWN */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 pb-12 sm:pb-20">
        <h2 className="font-display text-3xl sm:text-4xl mb-6 sm:mb-10 flex items-center">
          Performance <em className="italic ml-2">breakdown</em>
          <MetricTooltip
            title="Overall score"
            description="A weighted composite of all six metrics: Relevance (25%), Technical depth (20%), STAR structure (15%), Fluency (15%), Pacing (10%), Pause quality (8%), and Confidence (7%)."
            details="Weightings reflect the relative importance of content quality over delivery style in professional interview contexts."
          />
        </h2>

        <div className="space-y-6">
          <MetricRow
            label="Relevance"
            value={Math.round(report.average_relevance)}
            color="bg-accent"
            tooltip={
              <MetricTooltip
                title="Relevance"
                description="How closely your answer aligns with the role's vocabulary and your CV. Higher scores mean you're discussing topics directly relevant to the position."
                details="Calculated using TF-IDF cosine similarity between your transcript and the combined CV + JD context. Measures vocabulary alignment, not answer structure."
                methodologyAnchor="relevance"
              />
            }
          />
          <MetricRow
            label="Technical depth"
            value={Math.round(report.average_technical_depth)}
            color="bg-accent-soft"
            tooltip={
              <MetricTooltip
                title="Technical depth"
                description="Density of domain-specific terminology in your answer. Higher density signals genuine expertise vs surface-level knowledge."
                details="The AI extracts technical vocabulary from your CV/JD (Pass 1) and identifies expert terms in your transcript (Pass 2). Weighted matching applied: CV/JD-aligned terms count fully, transcript-only terms count at 50%."
                methodologyAnchor="technical-depth"
              />
            }
          />
          <MetricRow
            label="STAR structure"
            value={Math.round(report.average_star)}
            color="bg-gold"
            tooltip={
              <MetricTooltip
                title="STAR structure"
                description="Whether your answer follows the STAR framework (Situation, Task, Action, Result) — a widely-recommended format for behavioural answers."
                details="The AI detects each component independently. Higher scores mean you're providing context, describing your actions, and explaining outcomes."
                methodologyAnchor="star"
              />
            }
          />
          <MetricRow
            label="Fluency"
            value={Math.round(report.average_fluency)}
            color="bg-accent-soft"
            tooltip={
              <MetricTooltip
                title="Fluency"
                description="How smoothly you speak. Measured by counting filler words ('um', 'uh', 'like') relative to total word count."
                details="Speaking naturally without excessive hedging signals confidence and preparation. Score is inverse to filler ratio: fewer fillers = higher fluency."
                methodologyAnchor="fluency"
              />
            }
          />
          <MetricRow
            label="Pacing"
            value={Math.round(report.average_pacing)}
            color="bg-accent"
            tooltip={
              <MetricTooltip
                title="Pacing"
                description="Whether your answer length and speed are appropriate. Combines duration (45–90s ideal) and words-per-minute."
                details="Too short suggests under-preparation; too long can lose listeners. Speech rate factors in: too slow feels rehearsed, too fast feels rushed."
                methodologyAnchor="pacing"
              />
            }
          />
          <MetricRow
            label="Pause quality"
            value={Math.round(report.average_pause_quality)}
            color="bg-accent-soft"
            tooltip={
              <MetricTooltip
                title="Pause quality"
                description="How effectively you use silence. Strategic 1–2 second pauses between thoughts signal composure."
                details="Based on Goldman-Eisler (1968) research on professional speech patterns. Filters out breath/rhythm gaps below 500ms; only counts meaningful thought pauses."
                methodologyAnchor="pause-quality"
              />
            }
          />
        </div>

        {/* Quick stats */}
        <div className="mt-8 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line">
          <div className="bg-frame p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              Questions
            </div>
            <div className="font-display text-4xl">
              {String(report.question_count).padStart(2, "0")}
            </div>
          </div>
          <div className="bg-frame p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              Mode
            </div>
            <div className="font-display text-2xl mt-2">
              {report.mode === "adaptive" ? "Adaptive" : "Fixed"}
            </div>
          </div>
          <div className="bg-frame p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              Filler words
            </div>
            <div className="font-display text-4xl">
              {report.total_filler_words}
            </div>
          </div>
        </div>
      </div>

      {/* PER-QUESTION BREAKDOWN */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 pb-12 sm:pb-20">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-6 items-center mb-6 sm:mb-10">
          <h2 className="font-display text-3xl sm:text-4xl">
            By <em className="italic">question</em>
          </h2>
          <div className="h-px bg-line-strong"></div>
          <div className="hidden sm:block font-mono text-xs uppercase tracking-widest text-ink-soft">
            {report.interview_results.length} answers
          </div>
        </div>

        <div className="space-y-3">
          {report.interview_results.map((q, idx) => {
            const score = calculatePerQuestionScore(q);
            const isExpanded = expandedId === idx;

            return (
              <div
                key={idx}
                className="border border-line bg-frame transition-colors"
              >
                {/* Card header (always visible, clickable) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : idx)}
                  className="w-full p-4 sm:p-7 grid grid-cols-[auto_1fr_auto_auto] gap-3 sm:gap-6 items-center text-left hover:bg-soft transition-colors"
                >
                  {/* Roman numeral */}
                  <div className="font-display text-3xl italic text-accent leading-none w-8 text-center">
                    {toRoman(idx + 1)}
                  </div>

                  {/* Question text and metrics */}
                  <div>
                    <div className="font-medium text-base text-ink mb-1.5 leading-snug">
                      {q.question}
                    </div>
                    <div className="font-mono text-[11px] text-ink-soft tracking-wide">
                      Fluency {Math.round(q.fluency_score)} · Relevance {Math.round(q.relevance_score)} · STAR {Math.round(q.star_analysis.star_score)} · WPM {Math.round(q.wpm)}
                    </div>
                  </div>

                  {/* Big score */}
                  <div className="font-display text-2xl sm:text-4xl text-accent leading-none">
                    {score}
                  </div>

                  {/* Expand chevron */}
                  <div className={`font-display italic text-2xl text-ink-faint transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    ↓
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-line p-4 sm:p-7 bg-soft space-y-6 sm:space-y-8">

                    {/* Transcript */}
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                        — Your answer (transcript)
                      </div>
                      <div className="font-display text-base sm:text-lg leading-relaxed text-ink italic">
                        "{q.transcript}"
                      </div>
                    </div>

                    {/* All metrics grid */}
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-4">
                        — Detailed metrics
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">Relevance</span>
                          <span className="text-ink">{Math.round(q.relevance_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">Technical depth</span>
                          <span className="text-ink">{Math.round(q.technical_depth_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">STAR structure</span>
                          <span className="text-ink">{Math.round(q.star_analysis.star_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">Fluency</span>
                          <span className="text-ink">{Math.round(q.fluency_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">Pacing</span>
                          <span className="text-ink">{Math.round(q.pacing_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft">Pause quality</span>
                          <span className="text-ink">{Math.round(q.pause_quality_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft inline-flex items-center">
                            Vocal confidence
                            <MetricTooltip
                              title="Vocal confidence"
                              description="Acoustic confidence indicator from voice tone. Measures vocal characteristics like pitch stability and energy."
                              details="Derived from acoustic emotion model. Note: trained on theatrical speech corpora — may underestimate confidence in professionally controlled interview speech."
                              methodologyAnchor="vocal-confidence"
                            />
                          </span>
                          <span className="text-ink">{Math.round(q.confidence_score)} / 100</span>
                        </div>
                        <div className="flex justify-between border-b border-line pb-2">
                          <span className="text-ink-soft inline-flex items-center">
                            Engagement
                            <MetricTooltip
                              title="Engagement"
                              description="Acoustic measure of vocal energy and animation in delivery. Reflects how dynamic versus monotone your speech sounds."
                              details="Calculated from acoustic features. Same model limitation as Vocal Confidence applies — may not perfectly capture engagement in controlled interview speech."
                              methodologyAnchor="engagement"
                            />
                          </span>
                          <span className="text-ink">{Math.round(q.engagement_score)} / 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Speech stats */}
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-4">
                        — Speech stats
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
                        <div className="border border-line p-3 bg-frame">
                          <div className="text-ink-soft mb-1">Duration</div>
                          <div className="font-display text-lg text-ink">
                            {Math.round(q.duration_seconds)}s
                          </div>
                        </div>
                        <div className="border border-line p-3 bg-frame">
                          <div className="text-ink-soft mb-1">Words/min</div>
                          <div className="font-display text-lg text-ink">
                            {Math.round(q.wpm)}
                          </div>
                        </div>
                        <div className="border border-line p-3 bg-frame">
                          <div className="text-ink-soft mb-1">Filler words</div>
                          <div className="font-display text-lg text-ink">
                            {q.filler_word_count}
                          </div>
                        </div>
                        <div className="border border-line p-3 bg-frame">
                          <div className="text-ink-soft mb-1">Tone</div>
                          <div className="font-display text-lg text-ink capitalize">
                            {q.detected_tone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AUDIO PLAYBACK (only if saved) */}
                    {q.audio_url && (
                      <div className="border-t border-line pt-6">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                          — Listen back to your answer
                        </div>
                        <audio
                          src={q.audio_url}
                          controls
                          className="w-full"
                          preload="metadata"
                        />
                      </div>
                    )}

                    {/* STAR BREAKDOWN */}
                    <div className="border-t border-line pt-6">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-4">
                        — STAR structure analysis
                      </div>

                      {/* Component indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <div className={`border p-4 text-center ${
                          q.star_analysis.has_situation
                            ? "border-success bg-success/10"
                            : "border-line bg-soft"
                        }`}>
                          <div className={`font-display text-xl sm:text-2xl mb-1 ${
                            q.star_analysis.has_situation ? "text-success" : "text-ink-faint"
                          }`}>
                            {q.star_analysis.has_situation ? "✓" : "—"}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                            Situation
                          </div>
                        </div>

                        <div className={`border p-4 text-center ${
                          q.star_analysis.has_action
                            ? "border-success bg-success/10"
                            : "border-line bg-soft"
                        }`}>
                          <div className={`font-display text-xl sm:text-2xl mb-1 ${
                            q.star_analysis.has_action ? "text-success" : "text-ink-faint"
                          }`}>
                            {q.star_analysis.has_action ? "✓" : "—"}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                            Action
                          </div>
                        </div>

                        <div className={`border p-4 text-center ${
                          q.star_analysis.has_result
                            ? "border-success bg-success/10"
                            : "border-line bg-soft"
                        }`}>
                          <div className={`font-display text-xl sm:text-2xl mb-1 ${
                            q.star_analysis.has_result ? "text-success" : "text-ink-faint"
                          }`}>
                            {q.star_analysis.has_result ? "✓" : "—"}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                            Result
                          </div>
                        </div>
                      </div>

                      {/* STAR feedback narrative */}
                      <div className="bg-frame border border-line p-4">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                          AI feedback
                        </div>
                        <div className="font-display text-base italic text-ink leading-relaxed">
                          "{q.star_analysis.star_feedback}"
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-frame border border-warn max-w-md w-full p-10">
            <div className="font-mono text-xs uppercase tracking-widest text-warn mb-3">
              — Permanent action
            </div>
            <h3 className="font-display text-3xl mb-4">
              Delete this <em className="italic text-warn">report</em>?
            </h3>
            <p className="text-ink-soft text-sm leading-relaxed mb-2">
              This will permanently delete:
            </p>
            <ul className="text-ink-soft text-sm leading-relaxed mb-6 list-none pl-0">
              <li className="py-1 border-b border-line">• The full interview report</li>
              <li className="py-1 border-b border-line">• All AI-generated feedback and metrics</li>
              <li className="py-1">• Any saved audio recordings from this session</li>
            </ul>
            <p className="text-ink-soft text-sm mb-8">
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="flex-1 py-3 border border-line-strong font-mono text-xs uppercase tracking-widest text-ink hover:bg-soft transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-warn text-page font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Metric Row Component =====

interface MetricRowProps {
  label: string;
  value: number;
  color: string;
  tooltip?: React.ReactNode;
}

function MetricRow({ label, value, color, tooltip }: MetricRowProps) {
  return (
    <div className="grid grid-cols-[100px_1fr_40px] sm:grid-cols-[180px_1fr_60px] gap-4 sm:gap-8 items-center py-3 sm:py-4 border-b border-line">
      <div className="font-display text-base sm:text-2xl flex items-center">{label}{tooltip}</div>
      <div className="h-2 bg-line relative">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-right font-mono text-sm sm:text-xl text-ink">{value}</div>
    </div>
  );
}

export default ResultsPage;
