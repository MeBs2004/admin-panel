import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm dark:border-[var(--border)]">
      <span className="text-gray-500 dark:text-gray-400">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-[var(--border)] dark:hover:bg-white/5"
        >
          <FiChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-[var(--border)] dark:hover:bg-white/5"
        >
          Next <FiChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
