import { FiInbox } from "react-icons/fi";

export default function EmptyState({ title, description, action, icon: Icon = FiInbox }) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
        <Icon className="h-5 w-5" />
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
