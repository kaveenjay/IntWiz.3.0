import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
