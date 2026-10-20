import { useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiCpu,
  FiMessageSquare,
  FiEye,
  FiBarChart2,
  FiUsers,
  FiCreditCard,
  FiSettings,
  FiLogOut,
  FiX,
  FiCode,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import useNavIndicator, { NavIndicator } from "./useNavIndicator.jsx";

// Items with `requires` are hidden from roles that can't open them
// (the routes are role-gated to match). UX only — the backend
// independently enforces what each one can actually do.
export const ITEMS = [
  { to: "/company/overview", label: "Overview", icon: FiGrid },
  { to: "/company/chatbots", label: "My Chatbots", icon: FiCpu },
  { to: "/company/conversations", label: "Conversations", icon: FiMessageSquare },
  { to: "/company/visitors", label: "Visitors", icon: FiEye },
  { to: "/company/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/company/team", label: "Team", icon: FiUsers },
  { to: "/company/billing", label: "Plan & Usage", icon: FiCreditCard, requires: PERMISSIONS.USAGE_VIEW },
  { to: "/company/developer", label: "Developer", icon: FiCode, requires: PERMISSIONS.DEVELOPER_VIEW },
  { to: "/company/settings", label: "Company Settings", icon: FiSettings },
];

export default function CompanySidebar({ open, onClose }) {
  const { logout, user } = useAuth();
  const items = ITEMS.filter((item) => !item.requires || can(user?.role, item.requires));
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const contentRef = useRef(null);
  const indicator = useNavIndicator(contentRef, [pathname, user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate("/company/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white/90 backdrop-blur transition-transform duration-300 ease-in-out dark:bg-[var(--surface)] dark:border-[var(--border)] lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient bg-[length:200%_200%] text-sm font-bold text-white shadow-glow animate-gradient-shift">
              N
              <span className="absolute inset-0 rounded-xl animate-ring-pulse" aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">Nuformly</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Company Panel
              </p>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        {/* Only this nav list scrolls if it overflows — the shell
            around it never does, matching the main AdminLayout's
            scroll ownership convention. */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div ref={contentRef} className="relative">
          <NavIndicator style={indicator} />
          <ul className="space-y-0.5">
            {items.map((item, itemIndex) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to} className="animate-slide-in-left" style={{ animationDelay: `${itemIndex * 50}ms` }}>
                  <NavLink
                    to={item.to}
                    data-nav-active={active}
                    onClick={onClose}
                    className={`group relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "text-primary-600 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-50 hover:pl-4 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110 ${active ? "text-primary-500 dark:text-emerald-300" : ""}`} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          </div>
        </nav>

        <div className="shrink-0 border-t border-gray-100 p-2 dark:border-white/5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <FiLogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
