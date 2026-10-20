// Animated gradient hero used at the top of each dashboard.
export default function HeroBanner({ eyebrow, title, subtitle, action, children }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl bg-brand-gradient bg-[length:220%_220%] p-6 text-white shadow-glow-lg animate-gradient-shift sm:p-8 animate-fade-in-up">
      <span className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-blob-drift" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl animate-blob-drift [animation-delay:-6s]" aria-hidden="true" />
      <span className="pointer-events-none absolute right-24 top-6 h-24 w-24 rounded-full bg-sky-300/30 blur-2xl animate-float-y" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse-soft" />
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-xl text-sm text-white/80">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="relative mt-5">{children}</div>}
    </div>
  );
}
