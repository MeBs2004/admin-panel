import { FiCheck } from "react-icons/fi";
import { SECTOR_TEMPLATES } from "../../../config/sectorTemplates.js";

const GRADIENTS = {
  energy: "from-amber-400 to-orange-500",
  education: "from-sky-400 to-indigo-500",
  digital_marketing: "from-fuchsia-400 to-rose-500",
  general: "from-emerald-400 to-teal-500",
};

// A company's registered industry (Energy, Education, etc. —
// Company.industry) and a chatbot's TEMPLATE here are deliberately
// different concepts: one company can create multiple chatbots and
// pick a different template for each, independent of what industry
// the company itself is registered under.
export default function StepTemplate({ template, setTemplate }) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Choose a template</h2>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Every template uses the same chatbot engine and widget — this only selects which specialized
        features and assistant guidance are enabled. You can create another chatbot with a different
        template at any time.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTOR_TEMPLATES.map((t, i) => {
          const Icon = t.icon;
          const selected = template === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTemplate(t.value)}
              style={{ "--stagger-index": i }}
              className={`stagger-in group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-[0.98] ${
                selected
                  ? "border-primary-400 bg-primary-50/70 ring-2 ring-primary-400/40 dark:border-primary-500 dark:bg-primary-500/10"
                  : "border-gray-200 hover:border-primary-300 dark:border-[var(--border)]"
              }`}
            >
              <span
                className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-50 ${GRADIENTS[t.value] || GRADIENTS.general}`}
                aria-hidden="true"
              />
              <span
                className={`relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${GRADIENTS[t.value] || GRADIENTS.general}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="relative text-sm font-semibold text-gray-900 dark:text-gray-100">{t.label}</p>
              <p className="relative mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t.description}</p>
              {selected && (
                <span className="pop-in absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white shadow">
                  <FiCheck className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
