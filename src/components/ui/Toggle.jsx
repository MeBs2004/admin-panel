export default function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={`flex items-center justify-between gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-gray-400">{description}</span>
          )}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-primary-500" : "bg-gray-200 dark:bg-white/10"
        } ${disabled ? "" : "focus-visible:ring-2 focus-visible:ring-primary-400/50"}`}
        style={{ height: "22px" }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
