import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface TopNavProps {
  showNavLinks?: boolean;
}

function getInitials(email: string): string {
  if (!email) return "U";
  const username = email.split("@")[0];
  if (username.length >= 2) {
    return (username[0] + username[1]).toUpperCase();
  }
  return username.slice(0, 1).toUpperCase();
}

export default function TopNav({ showNavLinks = true }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  const initials = user?.email ? getInitials(user.email) : "U";
  const email = user?.email ?? "";

  // Reload if already on dashboard, else navigate there
  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/dashboard") {
      window.location.reload();
    } else {
      navigate("/dashboard");
    }
  };

  // Scroll to past-interviews section; navigate first if not on dashboard
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      setTimeout(() => {
        document.getElementById("past-interviews")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("past-interviews")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onDashboard = location.pathname === "/dashboard";
  const onHelp      = location.pathname === "/help";

  return (
    <nav className="bg-frame border-b border-line px-12 py-5 flex justify-between items-center">

      {/* Logo */}
      <a href="/dashboard" onClick={handleDashboardClick} className="cursor-pointer font-display text-2xl">
        Int<em className="italic text-accent">Wiz</em>
      </a>

      {/* Middle nav links */}
      {showNavLinks && (
        <div className="flex gap-8">
          <a
            href="/dashboard"
            onClick={handleDashboardClick}
            className={`text-sm transition-colors ${onDashboard ? "text-ink font-medium" : "text-ink-soft hover:text-ink"}`}
          >
            Dashboard
          </a>
          <a
            href="#past-interviews"
            onClick={handleHistoryClick}
            className="text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            History
          </a>
          <Link
            to="/help"
            className={`text-sm transition-colors ${onHelp ? "text-ink font-medium" : "text-ink-soft hover:text-ink"}`}
          >
            Help
          </Link>
        </div>
      )}

      {/* User avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="w-9 h-9 rounded-full bg-accent text-page flex items-center justify-center font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          {initials}
        </div>

        {dropdownOpen && (
          <div className="absolute top-12 right-0 w-60 bg-frame border border-line shadow-lg z-50 p-1">

            {/* Signed in as */}
            <div className="px-4 py-3 border-b border-line">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                — Signed in as
              </div>
              <div className="text-xs text-ink truncate mt-0.5">{email}</div>
            </div>

            {/* Profile */}
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-soft transition-colors"
            >
              Profile
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-soft transition-colors"
            >
              Settings
            </Link>

            <div className="border-t border-line my-1" />

            {/* Logout */}
            <button
              onClick={async () => {
                setDropdownOpen(false);
                await logout();
                navigate("/login");
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-warn font-medium hover:bg-warn/10 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
