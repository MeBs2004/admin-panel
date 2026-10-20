import { FiInbox } from "react-icons/fi";

export default function EmptyState({ title, description, action, icon: Icon = FiInbox }) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="relative mb-2 animate-float-y">
        <span className="absolute inset-0 -z-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-indigo-400/30 blur-xl" aria-hidden="true" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 text-primary-500 ring-1 ring-black/5 dark:from-emerald-500/10 dark:to-indigo-500/10 dark:text-emerald-300 dark:ring-white/10">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
