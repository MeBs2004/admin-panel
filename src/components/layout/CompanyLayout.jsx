import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import PageLoader from "../ui/PageLoader.jsx";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiMoon, FiLogOut, FiPlusCircle } from "react-icons/fi";
import CompanySidebar, { ITEMS } from "./CompanySidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import Header from "./Header.jsx";
import RouteProgress from "./RouteProgress.jsx";
import CommandPalette from "./CommandPalette.jsx";
import AmbientGlow from "./AmbientGlow.jsx";
import ScrollTopButton from "./ScrollTopButton.jsx";
import { can } from "../../utils/permissions.js";
import { toggleTheme } from "../../utils/theme.js";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mainRef = useRef(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const paletteItems = useMemo(
    () => [
      ...ITEMS.filter((it) => !it.requires || can(user?.role, it.requires)).map((it) => ({
        id: `nav:${it.to}`,
        label: it.label,
        group: "Pages",
        icon: it.icon,
        to: it.to,
      })),
      { id: "act:create", label: "Create a chatbot", group: "Actions", icon: FiPlusCircle, to: "/company/chatbots/new" },
      { id: "act:theme", label: "Toggle dark mode", group: "Actions", icon: FiMoon, run: () => toggleTheme(), keywords: "theme light dark appearance" },
      { id: "act:logout", label: "Log out", group: "Actions", icon: FiLogOut, run: async () => { await logout(); navigate("/company/login"); } },
    ],
    [user?.role, logout, navigate],
  );

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
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || "Nuformly";

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <RouteProgress />
      <AmbientGlow />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
      <CompanySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} onOpenSidebar={() => setSidebarOpen(true)} onOpenSearch={() => setPaletteOpen(true)} profilePath="/company/account" loginPath="/company/login" />
        <main ref={mainRef} className="app-aurora min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={location.pathname} className="mx-auto h-full max-w-[1600px] animate-fade-in-up">
            {/* pages load on first visit; the sidebar and header stay put meanwhile */}
            <Suspense fallback={<PageLoader inline />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <ScrollTopButton scrollRef={mainRef} />
      </div>
    </div>
  );
}
