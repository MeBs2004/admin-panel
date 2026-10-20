// Branded full-screen loader: the logo tile with rings pulsing out of it.
export default function PageLoader({ label = "Loading Nuformly" }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)]" role="status" aria-live="polite">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="loader-ring absolute inset-0 rounded-2xl bg-primary-400/40" />
        <span className="loader-ring absolute inset-0 rounded-2xl bg-primary-400/30 [animation-delay:.5s]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient bg-[length:200%_200%] text-2xl font-bold text-white shadow-glow-lg animate-gradient-shift animate-float-y">
          N
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <i key={i} className="block h-1 w-1 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}
