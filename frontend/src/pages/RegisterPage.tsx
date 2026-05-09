import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function RegisterPage() {
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists. Please sign in instead.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please use at least 6 characters.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection.");
          break;
        default:
          setError("Something went wrong. Please try again.");
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
          Practice doesn't make perfect — practice makes <em className="italic">prepared</em>.
        </div>

        <div className="font-mono text-xs uppercase tracking-widest opacity-60">
          — Begin your interview preparation
        </div>
      </aside>

      {/* RIGHT SIDE — Register Form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-0 max-w-lg mx-auto w-full">

        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — Get started
        </div>

        <h2 className="font-display text-4xl sm:text-5xl mb-2">
          Create <em className="italic text-accent">account</em>
        </h2>

        <p className="text-ink-soft mb-10 text-base">
          Start practicing with personalised AI-powered interviews.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="mb-5">
            <label className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="you@university.edu"
              className="w-full px-4 py-3 border border-line-strong bg-frame text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password field */}
          <div className="mb-5">
            <label className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border border-line-strong bg-frame text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Confirm Password field */}
          <div className="mb-5">
            <label className="block font-mono text-xs uppercase tracking-widest text-ink-soft mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 border border-line-strong bg-frame text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-ink text-page font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-8 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="text-accent border-b border-accent">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
