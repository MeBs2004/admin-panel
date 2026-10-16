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

// Items with `requires` are hidden from roles that can't open them
// (the routes are role-gated to match). UX only — the backend
// independently enforces what each one can actually do.
const ITEMS = [
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:bg-[var(--surface)] dark:border-[var(--border)] lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white shadow-card">
              N
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
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
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
