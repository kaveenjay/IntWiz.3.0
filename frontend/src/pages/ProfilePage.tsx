import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TopNav from "../components/TopNav";
import { getUserReports } from "../services/api";
import type { InterviewSummary } from "../services/api";

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setError("Could not identify your account.");
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const response = await getUserReports(user.uid);
        setReports(response.reports);
      } catch {
        setError("Failed to load your profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.uid]);

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateLifetimeStats = () => {
    if (reports.length === 0) {
      return {
        totalInterviews: 0,
        totalMinutes: 0,
        bestScore: 0,
        averageScore: 0,
        mostRecent: null as string | null,
      };
    }

    const totalInterviews = reports.length;
    const bestScore = Math.max(...reports.map((r) => r.overall_score));
    const averageScore = Math.round(
      reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length
    );
    const totalMinutes = reports.reduce((sum, r) => sum + r.question_count, 0);
    const sorted = [...reports].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const mostRecent = sorted[0]?.timestamp || null;

    return { totalInterviews, totalMinutes, bestScore, averageScore, mostRecent };
  };

  const getAchievements = (
    totalInterviews: number,
    bestScore: number,
    allReports: InterviewSummary[]
  ) => {
    const hasWeeklyStreak = (() => {
      if (allReports.length < 3) return false;
      const ts = [...allReports]
        .map((r) => new Date(r.timestamp).getTime())
        .sort((a, b) => a - b);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      for (let i = 0; i <= ts.length - 3; i++) {
        if (ts[i + 2] - ts[i] <= sevenDaysMs) return true;
      }
      return false;
    })();

    return [
      {
        label: "First interview",
        description: "Completed your first practice session",
        earned: totalInterviews >= 1,
      },
      {
        label: "Five sessions",
        description: "Completed five practice interviews",
        earned: totalInterviews >= 5,
      },
      {
        label: "Strong performer",
        description: "Scored 80 or higher on an interview",
        earned: bestScore >= 80,
      },
      {
        label: "Active week",
        description: "Three interviews within seven days",
        earned: hasWeeklyStreak,
      },
    ];
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
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

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-frame">
        <TopNav />
        <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-warn mb-4">
            — Something went wrong
          </div>
          <h1 className="font-display text-5xl mb-4">
            Couldn't load <em className="italic text-accent">profile</em>
          </h1>
          <p className="text-ink-soft mb-8">{error}</p>
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

  // ── DERIVED DATA ──────────────────────────────────────────────────────────
  const stats = calculateLifetimeStats();
  const achievements = getAchievements(stats.totalInterviews, stats.bestScore, reports);

  // ── MAIN UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-frame">
      <TopNav />

      <div className="max-w-4xl mx-auto px-12 py-14">

        {/* HEADER */}
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — Your account
        </div>
        <h1 className="font-display text-6xl leading-none mb-4">
          Hello, <em className="italic text-accent">{user?.email?.split("@")[0]}</em>
        </h1>
        <p className="text-ink-soft text-base mb-14">
          A snapshot of your interview practice journey so far.
        </p>

        {/* ACCOUNT INFO */}
        <div className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
            <h2 className="font-display text-3xl">Account</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Email address
              </div>
              <div className="font-display text-xl break-all">{user?.email}</div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Member since
              </div>
              <div className="font-display text-xl">
                {user?.metadata?.creationTime
                  ? formatDate(user.metadata.creationTime)
                  : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* LIFETIME STATS */}
        <div className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
            <h2 className="font-display text-3xl">
              Lifetime <em className="italic">stats</em>
            </h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="grid grid-cols-4 gap-px bg-line border border-line">
            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                Total Interviews
              </div>
              <div className="font-display text-5xl leading-none">
                {String(stats.totalInterviews).padStart(2, "0")}
              </div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                Minutes Practiced
              </div>
              <div className="font-display text-5xl leading-none">{stats.totalMinutes}</div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                Best Score
              </div>
              <div className="font-display text-5xl leading-none text-accent">
                {stats.bestScore || "—"}
              </div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
                Average Score
              </div>
              <div className="font-display text-5xl leading-none">
                {stats.averageScore || "—"}
              </div>
            </div>
          </div>

          {stats.mostRecent && (
            <div className="mt-4 font-mono text-xs text-ink-soft">
              Most recent interview: {formatDate(stats.mostRecent)}
            </div>
          )}
        </div>

        {/* ACHIEVEMENTS */}
        <div className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
            <h2 className="font-display text-3xl">Milestones</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`p-6 border ${
                  achievement.earned
                    ? "border-success bg-success/5"
                    : "border-line bg-soft"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`font-display text-2xl leading-none mt-0.5 ${
                      achievement.earned ? "text-success" : "text-ink-faint"
                    }`}
                  >
                    {achievement.earned ? "✓" : "—"}
                  </div>
                  <div>
                    <div
                      className={`font-display text-xl mb-1 ${
                        achievement.earned ? "text-ink" : "text-ink-faint"
                      }`}
                    >
                      {achievement.label}
                    </div>
                    <div
                      className={`text-sm ${
                        achievement.earned ? "text-ink-soft" : "text-ink-faint"
                      }`}
                    >
                      {achievement.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <button
            onClick={() => navigate("/interview/setup")}
            className="bg-ink text-page px-10 py-5 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-3 mx-auto"
          >
            Start New Interview
            <span className="font-display italic text-2xl">→</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;
