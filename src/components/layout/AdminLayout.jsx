import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiMoon, FiLogOut, FiPlusCircle } from "react-icons/fi";
import Sidebar, { NAV_GROUPS } from "./Sidebar.jsx";
import Header from "./Header.jsx";
import RouteProgress from "./RouteProgress.jsx";
import CommandPalette from "./CommandPalette.jsx";
import AmbientGlow from "./AmbientGlow.jsx";
import ScrollTopButton from "./ScrollTopButton.jsx";
import { can } from "../../utils/permissions.js";
import { toggleTheme } from "../../utils/theme.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Labels only — every route path below is unchanged from before this
// phase. Renaming a sidebar label never renames a URL.
const TITLES = {
  "/dashboard": "Overview",
  "/companies": "Companies",
  "/chatbots": "Chatbots",
  "/users": "Users",
  "/visitors": "Visitors",
  "/conversations": "Conversations",
  "/reports": "Analytics",
  "/audit-logs": "Audit Logs",
  "/settings": "Settings",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K quick search: every real page this role can open, plus a few actions.
  const paletteItems = useMemo(() => {
    const seen = new Set();
    const pages = [];
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.soon || item.hint || seen.has(item.to)) continue;
        if (item.requires && !can(user?.role, item.requires)) continue;
        seen.add(item.to);
        pages.push({ id: `nav:${item.to}`, label: item.label === "Overview" ? `${group.label} overview` : item.label, group: group.label, icon: item.icon, to: item.to });
      }
    }
    return [
      ...pages,
      { id: "act:create", label: "Create a chatbot", group: "Actions", icon: FiPlusCircle, to: "/chatbots/new" },
      { id: "act:theme", label: "Toggle dark mode", group: "Actions", icon: FiMoon, run: () => toggleTheme(), keywords: "theme light dark appearance" },
      { id: "act:logout", label: "Log out", group: "Actions", icon: FiLogOut, run: async () => { await logout(); navigate("/login"); } },
    ];
  }, [user?.role, logout, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title =
    Object.entries(TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || "Nuformly";

  // Phase 23 — pathname already encodes route params (e.g. /chatbots/:id),
  // so switching between detail pages resets scroll too; query-string-only
  // changes (tabs stored in ?search) intentionally do not. Resets the real
  // scroll container directly, never window.scrollTo — the document is no
  // longer the scroll owner (see index.css + the h-dvh/overflow-hidden
  // shell below), so window scroll position isn't meaningful here.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <RouteProgress />
      <AmbientGlow />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        role={user?.role}
      />
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenSearch={() => setPaletteOpen(true)}
        />
        <main ref={mainRef} className="app-aurora min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* h-full: lets a page that wants to fill the remaining
              viewport (e.g. ConversationsInbox's split-pane inbox) size
              itself with `h-full` against this real, bounded ancestor
              instead of recomputing raw 100vh math. Harmless for normal
              pages — height:100% on a plain block doesn't clip content,
              so shorter or taller pages still render/scroll exactly as
              before via <main>'s own overflow-y-auto. */}
          <div key={location.pathname} className="mx-auto h-full max-w-[1600px] animate-fade-in-up">
            <Outlet />
          </div>
        </main>
        <ScrollTopButton scrollRef={mainRef} />
      </div>
    </div>
  );
}
