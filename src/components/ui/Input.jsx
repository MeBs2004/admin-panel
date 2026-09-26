export default function Input({ label, error, className = "", ...rest }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 ${
          error
            ? "border-danger-500"
            : "border-gray-300 dark:border-[var(--border)]"
        } ${className}`}
        {...rest}
      />
      {error && (
        <span className="mt-1 block animate-fade-in text-xs text-danger-500">
          {error}
        </span>
      )}
    </label>
  );
}
