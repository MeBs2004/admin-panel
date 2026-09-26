import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
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
  const { user } = useAuth();
  const location = useLocation();
  const mainRef = useRef(null);

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
        />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
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
      </div>
    </div>
  );
}
