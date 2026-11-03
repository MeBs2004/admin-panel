import { useEffect, useState } from "react";
import { FiBookOpen, FiHelpCircle, FiUsers, FiCheck } from "react-icons/fi";
import api from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { CategoriesFaqsTab, CoursesTab, LeadsTab } from "../EducationConfiguration.jsx";

// Same icon-card/progress-counter treatment as StepEnergyFull.jsx, re-
// themed to Education's existing blue branding (EDUCATION_PATCH in
// chatbotSectorStarters.js) instead of Energy's emerald/green.
const SECTIONS = [
  { value: "faqs", label: "Categories & FAQs", blurb: "What you answer", icon: FiHelpCircle },
  { value: "courses", label: "Courses & Programs", blurb: "What you teach", icon: FiBookOpen },
  { value: "leads", label: "Leads", blurb: "Who's interested", icon: FiUsers },
];

/**
 * Wizard step (Education template only): the FULL Education
 * Configuration experience (Categories & FAQs, Courses & Programs,
 * Leads) reused as-is from EducationConfiguration.jsx's exported tab
 * components — identical behavior to the chatbot's own Education
 * Configuration page, reachable during creation because the wizard
 * creates the real chatbot right after the Basics step.
 */
export default function StepEducationFull({ chatbotId }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState("faqs");
  const [counts, setCounts] = useState({ faqs: 0, courses: 0, leads: 0 });

  const refreshCounts = async () => {
    try {
      const [config, courses, leads] = await Promise.all([
        api.get(`/chatbots/${chatbotId}/education/config`),
        api.get(`/chatbots/${chatbotId}/education/courses`),
        api.get(`/chatbots/${chatbotId}/education/leads`),
      ]);
      setCounts({
        faqs: config.data.config.enabledFAQIds.length,
        courses: courses.data.courses.length,
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
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-glow-lg">
            <FiBookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Build your education assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categories, FAQs, and courses — set up as much as you can now; you can always refine it later from the
              chatbot's own Education Configuration page.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 sm:self-auto">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
          {doneCount} of {SECTIONS.length} set up
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = tab === s.value;
          const count = counts[s.value];
          const isDone = count > 0;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => goTo(s.value)}
              className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                isActive
                  ? "border-transparent bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-glow-lg"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-blue-500/40"
              }`}
            >
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${
                  isActive ? "bg-white/20" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isDone && (
                  <span
                    className={`pop-in absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ${
                      isActive ? "bg-white text-blue-600 ring-blue-500" : "bg-blue-500 text-white ring-white dark:ring-[var(--surface)]"
                    }`}
                  >
                    <FiCheck className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span>
                <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>{s.label}</span>
                <span className={`block text-xs ${isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>
                  {isDone ? `${count} added · ${s.blurb.toLowerCase()}` : s.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--border)] dark:bg-[var(--surface)]">
        {tab === "faqs" && <CategoriesFaqsTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "courses" && <CoursesTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "leads" && <LeadsTab chatbotId={chatbotId} showToast={showToast} />}
      </div>
    </div>
  );
}
