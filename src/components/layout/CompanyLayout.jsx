import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CompanySidebar from "./CompanySidebar.jsx";
import Header from "./Header.jsx";

// The separate, minimal shell for the Company Admin Panel —
// deliberately its own layout/route namespace from AdminLayout, per
// the product requirement to distinguish platform administration
// from company access. Reuses Header as-is (realtime status, theme
// toggle, user menu) since none of that is Super-Admin-specific;
// only the sidebar and its own account/login destinations differ.
const TITLES = {
  "/company/overview": "Overview",
  "/company/chatbots": "My Chatbots",
  "/company/conversations": "Conversations",
  "/company/visitors": "Visitors",
  "/company/analytics": "Analytics",
  "/company/team": "Team",
  "/company/billing": "Plan & Usage",
  "/company/settings": "Company Settings",
  "/company/account": "My Account",
};

export default function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  const title =
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || "Nuformly";

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <CompanySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} onOpenSidebar={() => setSidebarOpen(true)} profilePath="/company/account" loginPath="/company/login" />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={location.pathname} className="mx-auto h-full max-w-[1600px] animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
