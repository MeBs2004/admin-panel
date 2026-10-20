import { useLocation } from "react-router-dom";

// A slim gradient bar that sweeps across the top on every navigation.
// Re-keyed by pathname so the CSS animation restarts each time.
export default function RouteProgress() {
  const { pathname } = useLocation();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5" aria-hidden="true">
      <div
        key={pathname}
        className="route-progress h-full w-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
      />
    </div>
  );
}
