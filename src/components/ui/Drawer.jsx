// Side-sliding panel — Modal.jsx's centered-dialog sibling, for
// content that wants to stay anchored while the admin keeps the page
// behind it in view (e.g. a row's detail without navigating away).
// Uses the same transition-transform approach as the rest of the
// design system rather than a new keyframe.
export default function Drawer({ open, onClose, title, children, footer }) {
  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-card-hover transition-transform duration-300 ease-out dark:bg-[var(--surface)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[var(--border)]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
