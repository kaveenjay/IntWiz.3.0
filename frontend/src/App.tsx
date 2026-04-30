import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

function LoginPlaceholder() {
  const { login, register, user, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      await login("test@intwiz.com", "test123456");
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        await register("test@intwiz.com", "test123456");
      } else {
        console.error("Login error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="text-center">
        <h1 className="font-display text-7xl text-ink mb-4">
          Int<em className="text-accent italic">Wiz</em>
        </h1>
        <p className="font-mono text-sm text-ink-soft uppercase tracking-widest mb-8">
          — Login Page Placeholder
        </p>

        {user ? (
          <div>
            <p className="text-ink mb-4">Logged in as: {user.email}</p>
            <button
              onClick={logout}
              className="px-6 py-3 bg-ink text-page font-mono text-xs uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleTestLogin}
            className="px-6 py-3 bg-accent text-page font-mono text-xs uppercase tracking-widest"
          >
            Test Login (creates test account)
          </button>
        )}
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="text-center">
        <h1 className="font-display text-5xl text-ink mb-4">
          Dashboard <em className="text-accent italic">Placeholder</em>
        </h1>
        <p className="font-mono text-sm text-ink-soft uppercase tracking-widest mb-2">
          — Protected Route Working ✓
        </p>
        <p className="text-ink-soft text-sm mb-8">User: {user?.email}</p>
        <button
          onClick={logout}
          className="px-6 py-3 bg-ink text-page font-mono text-xs uppercase tracking-widest"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
