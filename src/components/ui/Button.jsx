const VARIANTS = {
  primary:
    "bg-primary-500 text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover active:scale-[0.98] disabled:bg-primary-200 disabled:shadow-none",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] dark:bg-[var(--surface)] dark:text-gray-200 dark:border-[var(--border)] dark:hover:bg-white/5",
  danger:
    "bg-danger-500 text-white shadow-card hover:bg-danger-600 hover:shadow-card-hover active:scale-[0.98] disabled:bg-red-300 disabled:shadow-none",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98] dark:text-gray-300 dark:hover:bg-white/5",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
