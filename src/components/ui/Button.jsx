import { useState } from "react";

const VARIANTS = {
  primary:
    "btn-shine bg-gradient-to-r from-primary-500 via-primary-400 to-emerald-500 bg-[length:200%_100%] text-white shadow-card hover:bg-right hover:shadow-glow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:from-primary-200 disabled:via-primary-200 disabled:to-primary-200 disabled:shadow-none disabled:hover:translate-y-0",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] dark:bg-[var(--surface)] dark:text-gray-200 dark:border-[var(--border)] dark:hover:bg-white/5",
  danger:
    "btn-shine bg-gradient-to-r from-danger-500 to-rose-500 text-white shadow-card hover:shadow-card-hover hover:-translate-y-px active:scale-[0.98] disabled:from-red-300 disabled:to-red-300 disabled:shadow-none",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98] dark:text-gray-300 dark:hover:bg-white/5",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  onPointerDown,
  ...rest
}) {
  // Click ripple: a soft circle grows from where the button was pressed.
  const [ripples, setRipples] = useState([]);
  const handlePointerDown = (e) => {
    onPointerDown?.(e);
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = `${Date.now()}-${Math.random()}`;
    setRipples((r) => [...r, { id, size, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2 }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 650);
  };

  return (
    <button
      disabled={disabled || loading}
      onPointerDown={handlePointerDown}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {ripples.map((r) => (
        <span key={r.id} className="ripple-dot" style={{ width: r.size, height: r.size, left: r.x, top: r.y }} aria-hidden="true" />
      ))}
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
