import { FiSearch } from "react-icons/fi";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Select from "../../components/ui/Select.jsx";
import Input from "../../components/ui/Input.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import { STATUS_FILTERS, MODE_FILTERS, ASSIGNED_FILTERS, timeAgo } from "./conversationFilters.js";

export default function ConversationListPane({
  conversations,
  pagination,
  loading,
  error,
  onRetry,
  filters,
  onFiltersChange,
  onPageChange,
  selectedKey,
  onSelect,
  hiddenOnMobile,
}) {
  const set = (patch) => onFiltersChange({ ...filters, ...patch, page: 1 });

  return (
    <div className={`min-h-0 w-full flex-col border-r border-gray-200 dark:border-[var(--border)] lg:w-[360px] lg:shrink-0 ${hiddenOnMobile ? "hidden lg:flex" : "flex"}`}>
      <div className="border-b border-gray-100 p-3 dark:border-[var(--border)]">
        <div className="mb-2">
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search visitor, email, message..."
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => set({ status: f.value })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.status === f.value
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Select options={MODE_FILTERS} value={filters.mode} onChange={(e) => set({ mode: e.target.value })} className="text-xs" />
          <Select options={ASSIGNED_FILTERS} value={filters.assigned} onChange={(e) => set({ assigned: e.target.value })} className="text-xs" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-2 p-3">
            <SkeletonLine className="h-14 w-full" />
            <SkeletonLine className="h-14 w-full" />
            <SkeletonLine className="h-14 w-full" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}

        {!loading && !error && conversations.length === 0 && (
          <EmptyState title="No conversations yet" description="Visitor conversations will appear here as they come in." />
        )}

        {!loading &&
          !error &&
          conversations.map((c) => {
            const key = `${c.companyId}::${c.visitorId}`;
            const isSelected = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => onSelect(c)}
                className={`block w-full border-b border-gray-50 px-3 py-3 text-left transition-colors dark:border-white/5 ${
                  isSelected ? "bg-primary-50 dark:bg-primary-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {c.visitorName || c.visitorEmail || `Visitor ${c.visitorId.slice(0, 8)}`}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{c.lastMessagePreview || "—"}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <StatusBadge status={c.status} />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.mode === "HUMAN" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-400"
                    }`}
                  >
                    {c.mode}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[10px] text-gray-400">{c.companyName}</p>
              </button>
            );
          })}
      </div>

      {!loading && !error && conversations.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} onChange={onPageChange} />
      )}
    </div>
  );
}
