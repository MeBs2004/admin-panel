import { FiCheck, FiLayers, FiEdit3, FiCpu, FiBookOpen, FiDroplet, FiFlag } from "react-icons/fi";

const STEPS = [
  { key: "template", label: "Template", icon: FiLayers },
  { key: "basics", label: "Basics", icon: FiEdit3 },
  { key: "ai", label: "AI", icon: FiCpu },
  { key: "knowledge", label: "Knowledge", icon: FiBookOpen },
  { key: "customize", label: "Design", icon: FiDroplet },
  { key: "review", label: "Review", icon: FiFlag },
];

// Completed steps are clickable (jump back); upcoming ones aren't, so
// the required-field validation in the wizard can't be skipped.
export default function WizardProgress({ current, onStepClick }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  const pct = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="relative mb-8 px-2">
      {/* track + animated gradient fill */}
      <div className="absolute left-6 right-6 top-[18px] h-1 rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="relative flex items-start justify-between">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const Icon = step.icon;
          const clickable = isDone && onStepClick;
          return (
            <li key={step.key} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(step.key)}
                aria-current={isActive ? "step" : undefined}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                  isDone
                    ? "bg-gradient-to-br from-emerald-400 to-primary-500 text-white shadow-glow hover:scale-110"
                    : isActive
                      ? "scale-110 bg-white text-primary-600 shadow-glow-lg ring-2 ring-primary-400 dark:bg-[var(--surface)] dark:text-emerald-300"
                      : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                {isActive && <span className="absolute inset-0 rounded-full animate-ring-pulse" aria-hidden="true" />}
                {isDone ? <FiCheck className="pop-in h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </button>
              <span
                className={`hidden whitespace-nowrap text-xs font-medium transition-colors sm:block ${
                  isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
