import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiRadio,
  FiMessageSquare,
  FiEye,
  FiCpu,
  FiPlusCircle,
  FiTool,
  FiSliders,
  FiBookOpen,
  FiLayout,
  FiClipboard,
  FiSend,
  FiMessageCircle,
  FiUserCheck,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiActivity,
  FiZap,
  FiGlobe,
  FiLink,
  FiDatabase,
  FiMail,
  FiRepeat,
  FiUsers,
  FiShield,
  FiKey,
  FiDownload,
  FiBook,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { FaWhatsapp, FaInstagram, FaFacebookMessenger, FaTelegram, FaSlack, FaMicrosoft } from "react-icons/fa";
import WorkspaceSwitcher from "./WorkspaceSwitcher.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";

// Every item maps to exactly one of three real states:
//  - a real route (`to`, no `soon`/`hint`)          -> normal nav link
//  - a real feature embedded in another page (`hint`) -> links there, shows a tooltip, never highlights as "active"
//  - not built yet (`soon: true`)                    -> routes to /coming-soon, labeled "Soon", never a dead click
const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Overview", icon: FiGrid },
      { to: "/live-view", label: "Live View", icon: FiRadio },
      { to: "/conversations", label: "Conversations", icon: FiMessageSquare },
      { to: "/visitors", label: "Visitors", icon: FiEye },
    ],
  },
  {
    label: "Chatbots",
    items: [
      { to: "/chatbots", label: "All Chatbots", icon: FiCpu, exclude: ["/chatbots/new"] },
      { to: "/chatbots/new", label: "Create Chatbot", icon: FiPlusCircle },
      { to: "/chatbots", label: "Bot Builder", icon: FiTool, hint: "Open a chatbot, then click Bot Builder to build its conversation flow" },
      { to: "/chatbots", label: "AI Settings", icon: FiSliders, hint: "Open a chatbot, then click AI Settings" },
      { to: "/chatbots", label: "Knowledge Base", icon: FiBookOpen, hint: "Open a chatbot, then click Knowledge Base" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/coming-soon", label: "Widget Customization", icon: FiLayout, soon: true },
      { to: "/coming-soon", label: "Forms", icon: FiClipboard, soon: true },
      { to: "/coming-soon", label: "Proactive Messages", icon: FiSend, soon: true },
      { to: "/coming-soon", label: "Canned Replies", icon: FiMessageCircle, soon: true },
      { to: "/coming-soon", label: "Human Handoff", icon: FiUserCheck, soon: true },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/reports", label: "Analytics", icon: FiBarChart2 },
      { to: "/coming-soon", label: "Conversation Analytics", icon: FiPieChart, soon: true },
      { to: "/coming-soon", label: "Visitor Analytics", icon: FiTrendingUp, soon: true },
      { to: "/coming-soon", label: "Bot Performance", icon: FiActivity, soon: true },
      { to: "/coming-soon", label: "AI Usage", icon: FiZap, soon: true },
    ],
  },
  {
    label: "Channels",
    items: [
      { to: "/coming-soon", label: "Website", icon: FiGlobe, soon: true },
      { to: "/coming-soon", label: "WhatsApp", icon: FaWhatsapp, soon: true },
      { to: "/coming-soon", label: "Instagram", icon: FaInstagram, soon: true },
      { to: "/coming-soon", label: "Facebook Messenger", icon: FaFacebookMessenger, soon: true },
      { to: "/coming-soon", label: "Telegram", icon: FaTelegram, soon: true },
    ],
  },
  {
    label: "Integrations",
    items: [
      { to: "/companies", label: "Webhooks", icon: FiLink, hint: "Open a company to manage its integrations" },
      { to: "/coming-soon", label: "CRM", icon: FiDatabase, soon: true },
      { to: "/coming-soon", label: "Email", icon: FiMail, soon: true },
      { to: "/coming-soon", label: "Slack", icon: FaSlack, soon: true },
      { to: "/coming-soon", label: "Microsoft Teams", icon: FaMicrosoft, soon: true },
      { to: "/coming-soon", label: "Automation", icon: FiRepeat, soon: true },
    ],
  },
  {
    label: "Team",
    items: [
      { to: "/users", label: "Users", icon: FiUsers, requires: PERMISSIONS.USERS_READ },
      { to: "/roles-permissions", label: "Roles & Permissions", icon: FiShield, requires: PERMISSIONS.USERS_READ },
      { to: "/chatbots", label: "Chatbot Access", icon: FiKey, hint: "Open a chatbot's Access tab to manage chatbot access", requires: PERMISSIONS.CHATBOT_ACCESS_MANAGE },
    ],
  },
  {
    label: "Developer",
    items: [
      { to: "/developer", label: "Overview", icon: FiGrid, requires: PERMISSIONS.DEVELOPER_VIEW },
      { to: "/developer/api-keys", label: "API Keys", icon: FiKey, requires: PERMISSIONS.DEVELOPER_KEYS_VIEW },
      { to: "/chatbots", label: "Installation", icon: FiDownload, hint: "Open a chatbot, then click Installation" },
      { to: "/developer/webhooks", label: "Webhooks", icon: FiLink, requires: PERMISSIONS.DEVELOPER_WEBHOOKS_VIEW },
      { to: "/developer/usage", label: "Usage", icon: FiActivity, requires: PERMISSIONS.DEVELOPER_USAGE_VIEW },
      { to: "/developer/docs", label: "API Documentation", icon: FiBook, requires: PERMISSIONS.DEVELOPER_DOCS_VIEW },
      { to: "/developer/settings", label: "Developer Settings", icon: FiSettings, requires: PERMISSIONS.DEVELOPER_SETTINGS_MANAGE },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/billing", label: "Overview", icon: FiCreditCard, requires: PERMISSIONS.BILLING_VIEW },
      { to: "/billing/plans", label: "Plans", icon: FiCreditCard, requires: PERMISSIONS.BILLING_VIEW },
      { to: "/billing/usage", label: "Usage", icon: FiBarChart2, requires: PERMISSIONS.USAGE_VIEW },
      { to: "/billing/history", label: "Billing History", icon: FiFileText, requires: PERMISSIONS.BILLING_INVOICES_VIEW },
      { to: "/billing/settings", label: "Billing Settings", icon: FiSettings, requires: PERMISSIONS.BILLING_VIEW },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/companies", label: "Companies", icon: FiBriefcase, requires: PERMISSIONS.COMPANIES_READ },
      { to: "/audit-logs", label: "Audit Logs", icon: FiFileText, requires: PERMISSIONS.AUDIT_READ },
      { to: "/settings", label: "Settings", icon: FiSettings },
    ],
  },
];

// Manual match instead of NavLink's default prefix matching, so a
// static child route (e.g. /chatbots/new) doesn't also light up its
// parent's list item (e.g. All Chatbots -> /chatbots) while still
// letting dynamic detail routes (e.g. /chatbots/:id) light it up.
const isItemActive = (item, pathname) => {
  if (item.soon || item.hint) return false;
  if (item.exclude?.some((ex) => pathname === ex || pathname.startsWith(ex + "/")))
    return false;
  return pathname === item.to || pathname.startsWith(item.to + "/");
};

export default function Sidebar({ open, onClose, collapsed, role }) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:bg-[var(--surface)] dark:border-[var(--border)] lg:static lg:translate-x-0 ${
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        } w-64 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white shadow-card">
              N
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Nuformly
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  AI Chatbot Platform
                </p>
              </div>
            )}
          </div>
          <button
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        <WorkspaceSwitcher collapsed={collapsed} />

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(
              (item) =>
                (!item.superAdminOnly || role === "SUPER_ADMIN") &&
                (!item.requires || can(role, item.requires))
            );
            if (items.length === 0) return null;

            return (
              <div key={group.label} className="mb-4">
                {!collapsed && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {group.label}
                  </p>
                )}
                {items.map((item) => {
                  const active = isItemActive(item, pathname);
                  return (
                    <NavLink
                      key={item.to + item.label}
                      to={item.soon ? "/coming-soon" : item.to}
                      state={item.soon ? { feature: item.label } : undefined}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      }`}
                      title={item.hint || (collapsed ? item.label : undefined)}
                    >
                      <span
                        className={`absolute left-0 h-5 w-0.5 rounded-r-full bg-primary-500 transition-all duration-200 ${
                          active ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
                      <span
                        className={`flex-1 truncate overflow-hidden whitespace-nowrap transition-all duration-200 ${
                          collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                      {!collapsed && item.soon && (
                        <span className="animate-fade-in shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-white/10 dark:text-gray-400">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
