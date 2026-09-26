import { useLocation } from "react-router-dom";

export default function ComingSoon() {
  const location = useLocation();
  const feature = location.state?.feature || "This module";

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-24 text-center dark:border-[var(--border)]">
      <p className="text-base font-medium text-gray-700 dark:text-gray-200">
        {feature} is coming soon
      </p>
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
        This part of the Nuformly Control Center is architected but not yet
        implemented.
      </p>
    </div>
  );
}
