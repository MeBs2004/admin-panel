// Animated gradient-mesh backdrop for the sign-in / sign-up screens.
export default function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.18),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.16),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.14),transparent_50%)]" />
      <span className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl animate-blob-drift" />
      <span className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-blob-drift [animation-delay:-7s]" />
      <span className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl animate-blob-drift [animation-delay:-12s]" />
      <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:26px_26px] text-emerald-900/10 dark:text-white/5" />
    </div>
  );
}
