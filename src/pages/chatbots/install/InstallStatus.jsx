import { FiRefreshCw } from "react-icons/fi";
import { installStatus } from "./installUtils.js";

const BADGE = {
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  stale: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  none: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};
const LABEL = { live: "Live", stale: "Not seen in the last 24 h", none: "Not detected yet" };

/** Where the widget has been seen running (Chatbot.installations). */
export default function InstallStatus({ installations, onRefresh, refreshing }) {
  const { state, sites } = installStatus(installations);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[state]}`}>{LABEL[state]}</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline disabled:opacity-50 dark:text-primary-400"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      {state === "none" ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Paste the line on your website, open a page of the site in your browser, then refresh here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 text-sm dark:divide-white/5">
          {sites.map((s) => (
            <li key={s.origin} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <span className={`h-2 w-2 rounded-full ${s.recent ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                {s.host}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">last seen {s.ago}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
