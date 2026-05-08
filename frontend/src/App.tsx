import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SetupPage from "./pages/SetupPage";
import InterviewRoomPage from "./pages/InterviewRoomPage";
import ResultsPage from "./pages/ResultsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/interview/setup" 
        element={
          <ProtectedRoute>
            <SetupPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interview/active" 
        element={
          <ProtectedRoute>
            <InterviewRoomPage />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/results/:reportId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-frame">
              <div className="text-center">
                <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">— Coming soon</div>
                <div className="font-display text-5xl">Profile <em className="italic text-accent">page</em></div>
                <div className="text-ink-soft mt-4">This page will be built next.</div>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-frame">
              <div className="text-center">
                <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">— Coming soon</div>
                <div className="font-display text-5xl">Settings <em className="italic text-accent">page</em></div>
                <div className="text-ink-soft mt-4">This page will be built next.</div>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-frame">
              <div className="text-center">
                <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">— Coming soon</div>
                <div className="font-display text-5xl">Help <em className="italic text-accent">page</em></div>
                <div className="text-ink-soft mt-4">This page will be built next.</div>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
