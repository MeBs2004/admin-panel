import { FiCheck } from "react-icons/fi";

const STEPS = [
  { key: "basics", label: "Basics" },
  { key: "ai", label: "AI" },
  { key: "knowledge", label: "Knowledge" },
  { key: "review", label: "Review" },
];

export default function WizardProgress({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="mb-8 flex items-center justify-between">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                  isDone
                    ? "bg-primary-500 text-white"
                    : isActive
                    ? "bg-primary-50 text-primary-600 ring-2 ring-primary-500 dark:bg-primary-500/10 dark:text-primary-300"
                    : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                }`}
              >
                {isDone ? <FiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  isActive
                    ? "text-gray-800 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  isDone ? "bg-primary-500" : "bg-gray-100 dark:bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
