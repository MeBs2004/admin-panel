import { SECTOR_TEMPLATES } from "../../../config/sectorTemplates.js";

// A company's registered industry (Energy, Education, etc. —
// Company.industry) and a chatbot's TEMPLATE here are deliberately
// different concepts: one company can create multiple chatbots and
// pick a different template for each, independent of what industry
// the company itself is registered under.
export default function StepTemplate({ template, setTemplate }) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Choose a template</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Every template uses the same chatbot engine and widget — this only selects which specialized
        features and assistant guidance are enabled. You can create another chatbot with a different
        template at any time.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTOR_TEMPLATES.map((t) => {
          const Icon = t.icon;
          const selected = template === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTemplate(t.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500"
                  : "border-gray-200 hover:bg-gray-50 dark:border-[var(--border)] dark:hover:bg-white/5"
              }`}
            >
              <span
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                  selected
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.label}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
