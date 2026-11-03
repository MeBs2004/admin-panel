import { useEffect, useState } from "react";
import { FiZap, FiHelpCircle, FiCpu, FiLayers, FiTruck, FiCheck } from "react-icons/fi";
import api from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { FuelsTab, QuestionsTab, EquipmentTab, SolutionsTab, SuppliersTab } from "../EnergyConfiguration.jsx";

// Mirrors the gradient/glow language WizardProgress.jsx already uses for
// "done" steps, so a configured Energy section reads as the same kind of
// accomplishment as completing a wizard step, not a separate visual system.
const SECTIONS = [
  { value: "fuels", label: "Fuels & Offerings", blurb: "What you sell", icon: FiZap },
  { value: "questions", label: "Questions", blurb: "What you ask", icon: FiHelpCircle },
  { value: "equipment", label: "Equipment", blurb: "What you stock", icon: FiCpu },
  { value: "solutions", label: "BOM & Solutions", blurb: "What you quote", icon: FiLayers },
  { value: "suppliers", label: "Suppliers", blurb: "Who you route to", icon: FiTruck },
];

/**
 * Wizard step (Energy template only): the FULL Energy Configuration
 * experience (Fuels & Offerings, Questions, Equipment, BOM &
 * Solutions, Suppliers) reused as-is from EnergyConfiguration.jsx's
 * exported tab components — identical behavior to the chatbot's own
 * Energy Configuration page, just reachable during creation because
 * the wizard now creates the real chatbot right after the Basics step
 * (see CreateChatbotWizard.jsx). Every save here is already live
 * against the real chatbotId, exactly like the standalone page.
 *
 * This file only adds presentation on top of that — a section nav with
 * live completion counts instead of a plain settings-page tab strip —
 * it changes no data, no API calls, no validation.
 */
export default function StepEnergyFull({ chatbotId }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState("fuels");
  const [counts, setCounts] = useState({ fuels: 0, questions: 0, equipment: 0, solutions: 0, suppliers: 0 });

  const refreshCounts = async () => {
    try {
      const [config, questions, equipment, solutions, suppliers] = await Promise.all([
        api.get(`/chatbots/${chatbotId}/energy/config`),
        api.get(`/chatbots/${chatbotId}/energy/questions`),
        api.get(`/chatbots/${chatbotId}/energy/equipment`),
        api.get(`/chatbots/${chatbotId}/energy/solutions`),
        api.get(`/chatbots/${chatbotId}/energy/suppliers`),
      ]);
      setCounts({
        fuels: config.data.config.enabledFuelKeys.length,
        questions: questions.data.questions.length,
        equipment: equipment.data.total,
        solutions: solutions.data.templates.length,
        suppliers: suppliers.data.total,
      });
    } catch {
      // Cosmetic only — if a count fails to load, the section nav just
      // shows 0 until the next refresh; it never blocks configuring.
    }
  };

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  // Re-check counts whenever the admin switches sections, so leaving a
  // section they just filled in updates its badge without needing a
  // dedicated save callback threaded through five independent tabs.
  const goTo = (value) => {
    setTab(value);
    refreshCounts();
  };

  const doneCount = Object.values(counts).filter((n) => n > 0).length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-primary-500 text-white shadow-glow-lg">
            <FiZap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Build your energy catalog</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fuels, questions, equipment, BOM rules and suppliers — set up as much as you can now; you can always
              refine it later from the chatbot's own Energy Configuration page.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-emerald-300 sm:self-auto">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
          {doneCount} of {SECTIONS.length} set up
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
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
                  ? "border-transparent bg-gradient-to-br from-emerald-400 to-primary-500 text-white shadow-glow-lg"
                  : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-primary-500/40"
              }`}
            >
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${
                  isActive ? "bg-white/20" : "bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-emerald-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isDone && (
                  <span
                    className={`pop-in absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ${
                      isActive ? "bg-white text-primary-600 ring-primary-500" : "bg-emerald-500 text-white ring-white dark:ring-[var(--surface)]"
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
        {tab === "fuels" && <FuelsTab chatbotId={chatbotId} showToast={showToast} goToSolutions={() => goTo("solutions")} />}
        {tab === "questions" && <QuestionsTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "equipment" && <EquipmentTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "solutions" && <SolutionsTab chatbotId={chatbotId} showToast={showToast} />}
        {tab === "suppliers" && <SuppliersTab chatbotId={chatbotId} showToast={showToast} />}
      </div>
    </div>
  );
}
