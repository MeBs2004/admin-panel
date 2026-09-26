import Breadcrumbs from "./Breadcrumbs.jsx";

export default function PageHeader({ title, description, action, breadcrumbs, badge, tabs }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            <span className="truncate">{title}</span>
            {badge}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </div>
  );
}
