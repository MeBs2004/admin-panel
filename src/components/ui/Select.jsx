export default function Select({ label, options = [], className = "", ...rest }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 hover:border-primary-300 focus:border-primary-400 focus:shadow-[0_6px_20px_-8px_rgba(26,138,86,0.45)] focus:ring-2 focus:ring-primary-400/30 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)] ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
