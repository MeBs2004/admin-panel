const HEX_RE = /^#([0-9A-Fa-f]{3}){1,2}$/;

export default function ColorInput({ label, value, onChange }) {
  const isValid = HEX_RE.test(value);

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-gray-300 bg-transparent p-0.5 dark:border-[var(--border)]"
          aria-label={label ? `${label} color picker` : "Color picker"}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 ${
            isValid ? "border-gray-300 dark:border-[var(--border)]" : "border-danger-500"
          }`}
        />
      </div>
      {!isValid && (
        <span className="mt-1 block text-xs text-danger-500">
          Enter a valid hex color, e.g. #0D5537
        </span>
      )}
    </label>
  );
}
