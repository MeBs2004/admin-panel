import { useEffect, useState } from "react";
import { FiTrendingUp, FiUser, FiLayers, FiSliders, FiUsers, FiCheck } from "react-icons/fi";
import api from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { BusinessProfileTab, ServicesCapabilitiesTab, LeadSettingsTab, LeadsTab } from "../MarketingConfiguration.jsx";

// Same icon-card/progress-counter treatment as StepEnergyFull.jsx /
// StepEducationFull.jsx, re-themed to Digital Marketing's existing
// purple branding (MARKETING_PATCH in chatbotSectorStarters.js).
const SECTIONS = [
  { value: "profile", label: "Business Profile", blurb: "Who you are", icon: FiUser },
  { value: "services", label: "Services & Capabilities", blurb: "What you do", icon: FiLayers },
  { value: "leadSettings", label: "Lead Settings", blurb: "How you qualify leads", icon: FiSliders },
  { value: "leads", label: "Leads", blurb: "Who's interested", icon: FiUsers },
];

/**
 * Wizard step (Digital Marketing template only): the FULL Marketing
 * Configuration experience (Business Profile, Services &
 * Capabilities, Lead Settings, Leads) reused as-is from
 * MarketingConfiguration.jsx's exported tab components — reachable
 * during creation because the wizard creates the real chatbot right
 * after the Basics step.
 */
export default function StepMarketingFull({ chatbotId }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState("profile");
  const [counts, setCounts] = useState({ profile: 0, services: 0, leadSettings: 0, leads: 0 });

  const refreshCounts = async () => {
    try {
      const [config, leads] = await Promise.all([
        api.get(`/chatbots/${chatbotId}/marketing/config`),
        api.get(`/chatbots/${chatbotId}/marketing/leads`),
      ]);
      const c = config.data.config;
      setCounts({
        profile: c.businessProfile?.businessName ? 1 : 0,
        services: c.enabledServiceKeys?.length || 0,
        leadSettings: c.leadSettings?.enabled ? 1 : 0,
        leads: leads.data.counts?.total || 0,
      });
    } catch {
      // Cosmetic only — a failed count just shows 0 until the next refresh.
    }
  };

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const goTo = (value) => {
    setTab(value);
    refreshCounts();
  };

  const doneCount = Object.values(counts).filter((n) => n > 0).length;

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="pop-in relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-glow-lg">
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 opacity-60 animate-ring-pulse" aria-hidden="true" />
            <FiTrendingUp className="relative h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Build your marketing assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Business profile, services, and AI capabilities — set up as much as you can now; you can always refine
              it later from the chatbot's own Marketing Configuration page.
            </p>
          </div>
        </div>
        <div
          key={doneCount}
          className="pop-in flex shrink-0 items-center gap-2 self-start rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 sm:self-auto"
        >
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
          {doneCount} of {SECTIONS.length} set up
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const isActive = tab === s.value;
          const count = counts[s.value];
          const isDone = count > 0;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => goTo(s.value)}
              style={{ "--stagger-index": i }}
              className={`stagger-in group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                isActive
                  ? "border-transparent bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-glow-lg"
                  : "border-gray-200 bg-white hover:border-violet-300 hover:shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-violet-500/40"
              }`}
            >
              {isActive && (
                <span
                  className="pointer-events-none absolute -inset-10 opacity-40"
                  style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.35), transparent 55%)" }}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "bg-white/20" : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isDone && (
                  <span
                    className={`pop-in absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ${
                      isActive ? "bg-white text-violet-600 ring-violet-500" : "bg-violet-500 text-white ring-white dark:ring-[var(--surface)]"
                    }`}
                  >
                    <FiCheck className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span className="relative">
                <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>{s.label}</span>
                <span className={`block text-xs ${isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>
                  {isDone ? `${count} set · ${s.blurb.toLowerCase()}` : s.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div key={tab} className="section-in rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--border)] dark:bg-[var(--surface)]">
        {tab === "profile" && <BusinessProfileTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "services" && <ServicesCapabilitiesTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "leadSettings" && <LeadSettingsTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "leads" && <LeadsTab chatbotId={chatbotId} showToast={showToast} />}
      </div>
    </div>
  );
}
