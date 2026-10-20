import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSun, FiMoon, FiChevronDown, FiSidebar, FiUser, FiLogOut, FiBell, FiSearch } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRealtimeStatus, onRealtimeStatusChange } from "../../services/realtime.js";
import { toggleTheme } from "../../utils/theme.js";

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
      <span className="relative flex h-2 w-2">
        {status === "live" && <span className="absolute inline-flex h-full w-full rounded-full bg-success-500" style={{ animation: "dotPing 1.8s ease-out infinite" }} />}
        <span className={`relative h-2 w-2 rounded-full transition-colors duration-200 ${STATUS_DOT[status]}`} />
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function Header({ title, onOpenSidebar, onToggleCollapse, onOpenSearch, profilePath = "/settings", loginPath = "/login" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  // The command palette can flip the theme too — stay in sync with it.
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("nuformly-theme", sync);
    return () => window.removeEventListener("nuformly-theme", sync);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(loginPath);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between glass border-b border-gray-200/70 px-4 dark:border-[var(--border)]">
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
        <h1 className="animate-fade-in text-base font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Open quick search"
            className="group hidden items-center gap-2 rounded-full border border-gray-200 bg-white/70 py-1.5 pl-3 pr-2 text-xs text-gray-500 transition-all duration-200 hover:-translate-y-px hover:border-primary-300 hover:text-primary-600 hover:shadow-card md:flex dark:border-[var(--border)] dark:bg-white/5 dark:text-gray-400"
          >
            <FiSearch className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            <span className="pr-4">Search…</span>
            <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-gray-400 dark:border-[var(--border)] dark:bg-white/5">⌘K</kbd>
          </button>
        )}
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
          onClick={() => toggleTheme()}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white shadow-glow ring-2 ring-white dark:ring-[var(--surface)]">
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
                    navigate(profilePath);
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
