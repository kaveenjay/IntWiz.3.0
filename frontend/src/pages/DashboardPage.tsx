import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserReports } from "../services/api";
import type { InterviewSummary } from "../services/api";
import { useNavigate } from "react-router-dom";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function userInitials(email: string): string {
  const name  = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchReports = async () => {
      try {
        const response = await getUserReports(user.uid);
        setReports(response.reports);
      } catch {
        setError("Failed to load interview history");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.uid]);

  const displayName = user?.email ? user.email.split("@")[0] : "there";
  const initials    = user?.email ? userInitials(user.email) : "?";

  // Shared nav — identical across all states
  const topNav = (
    <nav className="border-b border-line px-12 py-5 flex justify-between items-center">
      <div className="font-display text-2xl">
        Int<em className="italic text-accent">Wiz</em>
      </div>
      <div className="flex gap-8 items-center text-sm text-ink-soft">
        <span>Dashboard</span>
        <span>History</span>
        <span>Help</span>
        <div className="w-9 h-9 rounded-full bg-accent text-page flex items-center justify-center font-medium text-sm">
          {initials}
        </div>
      </div>
    </nav>
  );

  // ── STATE 1: LOADING ──────────────────────────────────────────────────────
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

  // ── STATE 2: ERROR ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-frame">
        {topNav}
        <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-warn mb-4">
            — Something went wrong
          </div>
          <h1 className="font-display text-5xl mb-4">
            Couldn't load <em className="italic text-accent">dashboard</em>
          </h1>
          <p className="text-ink-soft mb-8">
            We couldn't fetch your interview history. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-ink text-page px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Derived stats (safe to compute — loading is false, no error)
  const totalSessions = reports.length;
  const averageScore  = totalSessions
    ? Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / totalSessions)
    : 0;
  const bestScore = totalSessions
    ? Math.round(Math.max(...reports.map((r) => r.overall_score)))
    : 0;

  const interviews = reports.map((r) => ({
    id:            r.report_id,
    date:          formatTimestamp(r.timestamp),
    title:         r.mode.charAt(0).toUpperCase() + r.mode.slice(1) + " interview",
    questionCount: r.question_count,
    fluency:       Math.round(r.average_fluency),
    relevance:     Math.round(r.average_relevance),
    star:          0,
    score:         Math.round(r.overall_score),
  }));

  // Shared greeting + stats — used in both empty and happy-path views
  const greetingRow = (
    <div className="grid grid-cols-[1fr_auto] gap-8 items-end mb-14">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — {formatTodayDate()}
        </div>
        <h1 className="font-display text-6xl leading-none">
          Welcome back,<br />
          <em className="italic text-accent">{displayName}</em>
        </h1>
      </div>
      <button 
        onClick={() => navigate("/interview/setup")}
        className="bg-ink text-page px-8 py-5 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-3"
      >
        Start New Interview
        <span className="font-display italic text-xl">→</span>
      </button>
    </div>
  );

  const statsGrid = (
    <div className="grid grid-cols-3 gap-px bg-line border border-line mb-20">
      <div className="bg-frame p-9">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
          Total Sessions
        </div>
        <div className="font-display text-7xl leading-none">
          {String(totalSessions).padStart(2, "0")}
        </div>
        <div className="mt-3 font-mono text-xs text-ink-faint">— Practice history</div>
      </div>
      <div className="bg-frame p-9">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
          Average Score
        </div>
        <div className="font-display text-7xl leading-none">{averageScore}</div>
        <div className="mt-3 font-mono text-xs text-success">↑ Tracked over time</div>
      </div>
      <div className="bg-frame p-9">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
          Personal Best
        </div>
        <div className="font-display text-7xl leading-none">{bestScore}</div>
        <div className="mt-3 font-mono text-xs text-ink-faint">— Highest yet</div>
      </div>
    </div>
  );

  // ── STATE 3: EMPTY ────────────────────────────────────────────────────────
  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-frame">
        {topNav}
        <div className="px-12 py-14">
          {greetingRow}
          {statsGrid}
          <div className="border border-line-strong p-16 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
              — No interviews yet
            </div>
            <h2 className="font-display text-5xl mb-4">
              Ready to <em className="italic text-accent">start</em>?
            </h2>
            <p className="text-ink-soft">
              Your first interview will appear here. Click 'Start New Interview' above to begin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE 4: HAPPY PATH ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-frame">
      {topNav}
      <div className="px-12 py-14">
        {greetingRow}
        {statsGrid}

        {/* SECTION HEADER */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-6 items-center mb-8">
          <h2 className="font-display text-4xl">
            Past <em className="italic">interviews</em>
          </h2>
          <div className="h-px bg-line-strong" />
          <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            {interviews.length} sessions · sorted by date
          </div>
        </div>

        {/* INTERVIEW LIST */}
        <div className="border-t border-line-strong">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="grid grid-cols-[80px_1fr_auto_auto] gap-8 items-center py-7 border-b border-line"
            >
              <div className="font-mono text-xs text-ink-faint leading-relaxed">
                <strong className="block text-ink text-sm font-medium mb-0.5">
                  {interview.date.split(" · ")[0]}
                </strong>
                {interview.date.split(" · ")[1]}
              </div>
              <div>
                <h3 className="font-display text-2xl mb-1.5">{interview.title}</h3>
                <div className="flex gap-4 text-xs text-ink-soft">
                  <span>{interview.questionCount} questions</span>
                  <span>·</span>
                  <span>Fluency {interview.fluency}</span>
                  <span>·</span>
                  <span>Relevance {interview.relevance}</span>
                  <span>·</span>
                  <span>STAR {interview.star}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl text-accent leading-none">
                  {interview.score}
                </div>
                <div className="font-mono text-xs text-ink-faint uppercase tracking-widest mt-1">
                  / 100
                </div>
              </div>
              <button className="font-mono text-xs uppercase tracking-widest text-ink-soft border border-line-strong px-4 py-2.5">
                View →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
