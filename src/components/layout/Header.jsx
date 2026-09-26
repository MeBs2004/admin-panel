import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSun, FiMoon, FiChevronDown, FiSidebar, FiUser, FiLogOut, FiBell } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRealtimeStatus, onRealtimeStatusChange } from "../../services/realtime.js";

const STATUS_LABEL = { live: "Live", reconnecting: "Reconnecting", offline: "Offline" };
const STATUS_DOT = {
  live: "bg-success-500",
  reconnecting: "bg-warning-500 animate-pulse-soft",
  offline: "bg-gray-300 dark:bg-gray-600",
};

function RealtimeStatus() {
  const [status, setStatus] = useState(getRealtimeStatus());

  useEffect(() => onRealtimeStatusChange(setStatus), []);

  return (
    <span
      className="hidden items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-gray-500 sm:flex dark:text-gray-400"
      title={`Realtime: ${STATUS_LABEL[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function Header({ title, onOpenSidebar, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nuformly-theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:bg-[var(--surface)]/80 dark:border-[var(--border)]">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden dark:hover:bg-white/5"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <FiMenu />
        </button>
        <button
          className="hidden rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 lg:block dark:hover:bg-white/5"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
        >
          <FiSidebar />
        </button>
        <h1 className="animate-fade-in text-sm font-medium text-gray-700 dark:text-gray-200">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <RealtimeStatus />

        <button
          disabled
          title="Notifications — coming soon"
          aria-label="Notifications (coming soon)"
          className="cursor-not-allowed rounded-lg p-2 text-gray-300 dark:text-gray-600"
        >
          <FiBell />
        </button>

        <button
          onClick={toggleTheme}
          className="relative overflow-hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          aria-label="Toggle theme"
        >
          <span
            key={dark ? "sun" : "moon"}
            className="block animate-scale-in"
          >
            {dark ? <FiSun /> : <FiMoon />}
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
              {user?.name}
            </span>
            <FiChevronDown
              className={`hidden text-gray-400 transition-transform duration-150 sm:block ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right animate-scale-in rounded-lg border border-gray-200 bg-white py-1 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
                <div className="border-b border-gray-100 px-3 py-2 dark:border-[var(--border)]">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <FiUser className="h-3.5 w-3.5" /> My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 transition-colors hover:bg-danger-50 dark:hover:bg-red-950/30"
                >
                  <FiLogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
