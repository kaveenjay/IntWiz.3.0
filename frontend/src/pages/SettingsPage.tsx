import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import TopNav from "../components/TopNav";
import { getPreferences, savePreferences } from "../services/api";
import type { UserPreferences } from "../services/api";
import { useFocusTrap } from "../hooks/useFocusTrap";

function SettingsPage() {
  const { user, updatePassword } = useAuth();

  const [preferences,       setPreferences]       = useState<UserPreferences | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState("");
  const [saving,            setSaving]            = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword,   setCurrentPassword]   = useState("");
  const [newPassword,       setNewPassword]       = useState("");
  const [confirmPassword,   setConfirmPassword]   = useState("");
  const [passwordError,     setPasswordError]     = useState("");
  const [passwordSuccess,   setPasswordSuccess]   = useState(false);
  const [passwordLoading,   setPasswordLoading]   = useState(false);

  const firstPasswordInputRef = useRef<HTMLInputElement>(null);
  const passwordModalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(passwordModalRef, showPasswordModal);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchPrefs = async () => {
      try {
        const response = await getPreferences(user.uid);
        setPreferences(response.preferences);
      } catch {
        setError("Failed to load your settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, [user?.uid]);

  useEffect(() => {
    if (!showPasswordModal) return;

    // Focus the first input when modal opens
    firstPasswordInputRef.current?.focus();

    // Close modal on Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPasswordModal(false);
        setPasswordError("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showPasswordModal]);

  const handleUpdate = async (updates: Partial<UserPreferences>) => {
    if (!preferences || !user) return;

    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    setSaving(true);

    try {
      await savePreferences(user.uid, newPrefs);
      setSavedConfirmation("Preferences saved");
      setTimeout(() => setSavedConfirmation(""), 2000);
    } catch {
      setSavedConfirmation("Failed to save");
      setTimeout(() => setSavedConfirmation(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect");
      } else if (err.code === "auth/weak-password") {
        setPasswordError("New password is too weak");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("Please log out and log back in, then try again");
      } else {
        setPasswordError("Couldn't update password. Please try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-frame">
        <div className="text-center">
          <div className="font-display text-5xl mb-4">
            Int<em className="italic text-accent">Wiz</em>
          </div>
          <div role="status" aria-live="polite" className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            <span className="sr-only">Loading...</span>
            — Loading
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (error && !preferences) {
    return (
      <div className="min-h-screen bg-frame">
        <TopNav />
        <main id="main-content" className="max-w-3xl mx-auto px-12 py-20 text-center">
          <div role="alert">
            <div className="font-mono text-xs uppercase tracking-widest text-warn mb-4">
              — Something went wrong
            </div>
            <h1 className="font-display text-5xl mb-4">
              Couldn't load <em className="italic text-accent">settings</em>
            </h1>
            <p className="text-ink-soft mb-8">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-ink text-page px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  // ── MAIN UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-frame">
      <TopNav />

      <main id="main-content" className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-14">

        {/* HEADER */}
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          <span aria-hidden="true">— </span>Preferences
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none mb-4">
          <em className="italic text-accent">Settings</em>
        </h1>
        <p className="text-ink-soft text-sm sm:text-base mb-10 sm:mb-14">
          Manage your account and customize your interview defaults.
        </p>


        {/* ACCOUNT SECTION */}
        <div className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl">Account</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-line">
              <div>
                <div className="font-display text-xl mb-1">Email address</div>
                <div className="text-ink-soft text-sm break-all">{user?.email}</div>
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                Read only
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-line">
              <div>
                <div className="font-display text-xl mb-1">Password</div>
                <div className="text-ink-soft text-sm">
                  Secure your account with a strong password
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="border border-line-strong px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-ink hover:bg-soft transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* INTERVIEW DEFAULTS SECTION */}
        {preferences && (
          <div className="mb-16">
            <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl">
                Interview <em className="italic">defaults</em>
              </h2>
              <div className="h-px bg-line-strong" />
            </div>
            <p className="text-ink-soft text-sm mb-6">
              These preferences pre-fill the setup form for new interviews. You can still change
              them per session.
            </p>

            <div className="space-y-1">
              {/* Default mode */}
              <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-line">
                <div>
                  <div className="font-display text-xl mb-1">Default mode</div>
                  <div className="text-ink-soft text-sm">
                    {preferences.defaultMode === "adaptive"
                      ? "Adaptive — AI decides length and difficulty"
                      : "Fixed — pre-set number of questions"}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdate({ defaultMode: "adaptive" })}
                    disabled={saving}
                    className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                      preferences.defaultMode === "adaptive"
                        ? "bg-ink text-page border-ink"
                        : "border-line-strong text-ink-soft hover:bg-soft"
                    }`}
                  >
                    Adaptive
                  </button>
                  <button
                    onClick={() => handleUpdate({ defaultMode: "fixed" })}
                    disabled={saving}
                    className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                      preferences.defaultMode === "fixed"
                        ? "bg-ink text-page border-ink"
                        : "border-line-strong text-ink-soft hover:bg-soft"
                    }`}
                  >
                    Fixed
                  </button>
                </div>
              </div>

              {/* Default question count — only visible in fixed mode */}
              {preferences.defaultMode === "fixed" && (
                <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-line">
                  <div>
                    <div className="font-display text-xl mb-1">Default question count</div>
                    <div className="text-ink-soft text-sm">
                      {preferences.defaultTargetQuestions} questions per interview
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {([5, 7, 10] as const).map((count) => (
                      <button
                        key={count}
                        onClick={() => handleUpdate({ defaultTargetQuestions: count })}
                        disabled={saving}
                        className={`w-10 h-10 flex items-center justify-center font-mono text-sm border transition-colors disabled:opacity-50 ${
                          preferences.defaultTargetQuestions === count
                            ? "bg-ink text-page border-ink"
                            : "border-line-strong text-ink-soft hover:bg-soft"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save audio toggle */}
              <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-line">
                <div>
                  <div className="font-display text-xl mb-1">Save audio recordings</div>
                  <div className="text-ink-soft text-sm">
                    Default state for the audio storage option. Audio auto-deletes after 30 days
                    regardless.
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleUpdate({ defaultSaveAudio: !preferences.defaultSaveAudio })
                  }
                  disabled={saving}
                  className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${
                    preferences.defaultSaveAudio ? "bg-accent" : "bg-line-strong"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-page rounded-full transition-transform ${
                      preferences.defaultSaveAudio ? "translate-x-7" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INFO SECTION */}
        <div className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl">Information</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Application
              </div>
              <div className="font-display text-xl">IntWiz</div>
              <div className="text-ink-soft text-sm mt-1">v1.0.0 (BSc Project)</div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Data sync
              </div>
              <div className="font-display text-xl">Cloud-backed</div>
              <div className="text-ink-soft text-sm mt-1">Synced via Firestore</div>
            </div>
          </div>
        </div>
      </main>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" role="dialog" aria-modal="true" aria-labelledby="password-modal-heading">
          <div
            ref={passwordModalRef}
            className="bg-frame border border-line max-w-md w-full p-6 sm:p-10"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
              — Account security
            </div>
            <h3 id="password-modal-heading" className="font-display text-3xl mb-2">
              Change <em className="italic text-accent">password</em>
            </h3>
            <p className="text-ink-soft text-sm mb-8">
              For security, please enter your current password before setting a new one.
            </p>

            {passwordSuccess ? (
              <div role="status" aria-live="polite" className="border-l-2 border-success bg-success/10 p-6">
                <div className="font-mono text-xs uppercase tracking-widest text-success mb-2">
                  — Success
                </div>
                <div className="font-display text-lg">
                  Password <em className="italic">updated</em>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange}>
                {passwordError && (
                  <div className="mb-4 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
                    {passwordError}
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="settings-current-password" className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
                    Current password
                  </label>
                  <input
                    ref={firstPasswordInputRef}
                    id="settings-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 border border-line-strong bg-frame text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="settings-new-password" className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 border border-line-strong bg-frame text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="settings-confirm-password" className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 border border-line-strong bg-frame text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={passwordLoading}
                    className="flex-1 py-3 border border-line-strong font-mono text-xs uppercase tracking-widest text-ink hover:bg-soft transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-3 bg-ink text-page font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Floating saved confirmation toast — fixed position, always visible */}
      {savedConfirmation && (
        <div role="status" aria-live="polite" className="fixed bottom-8 right-8 z-50 px-5 py-4 bg-frame border border-success shadow-lg text-success text-sm font-mono uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">✓</span>
            <span>{savedConfirmation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
