export default function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } max-h-[90vh] animate-scale-in overflow-y-auto rounded-xl bg-white shadow-card-hover dark:bg-[var(--surface)] dark:border dark:border-[var(--border)]`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[var(--border)]">
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
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
