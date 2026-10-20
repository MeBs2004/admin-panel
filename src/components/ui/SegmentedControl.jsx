export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-[var(--border)] dark:bg-white/5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
              value === opt.value
                ? "bg-white text-primary-600 shadow-sm ring-1 ring-primary-400/30 dark:bg-[var(--surface)] dark:text-emerald-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
