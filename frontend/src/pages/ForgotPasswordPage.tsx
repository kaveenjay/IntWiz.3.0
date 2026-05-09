import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      const code = err.code;
      if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError("Couldn't send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-frame">

      {/* LEFT SIDE — Editorial Quote Panel */}
      <aside className="hidden lg:flex bg-accent text-page p-12 flex-col justify-between relative overflow-hidden">
        <div className="font-display text-4xl">
          Int<em className="italic text-gold">Wiz</em>
        </div>

        <div className="font-display text-3xl leading-snug relative z-10">
          Forgetting is human. Recovery should be <em className="italic">simple</em>.
        </div>

        <div className="font-mono text-xs uppercase tracking-widest opacity-60">
          — Resetting your password
        </div>
      </aside>

      {/* RIGHT SIDE — Reset Form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-0 max-w-lg mx-auto w-full">

        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — Account recovery
        </div>

        <h2 className="font-display text-4xl sm:text-5xl mb-2">
          Reset <em className="italic text-accent">password</em>
        </h2>

        {!success ? (
          <>
            <p className="text-ink-soft mb-10 text-base">
              Enter the email associated with your account and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-line-strong bg-frame text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-ink text-page font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link →"}
              </button>
            </form>
          </>
        ) : (
          <div className="border-l-2 border-success bg-success/10 p-6 mb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-success mb-2">
              — Email sent
            </div>
            <h3 className="font-display text-2xl mb-3">
              Check your <em className="italic">inbox</em>
            </h3>
            <p className="text-ink-soft text-sm leading-relaxed">
              If an account exists for <strong className="text-ink">{email}</strong>, 
              we've sent a password reset link. Click the link in the email to set a 
              new password. The link will expire in one hour.
            </p>
            <p className="text-ink-faint text-xs mt-4">
              Don't see it? Check your spam folder, or wait a few minutes — emails can take time to arrive.
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-ink-soft">
          Remember your password?{" "}
          <Link to="/login" className="text-accent border-b border-accent">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
