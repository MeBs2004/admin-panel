import Breadcrumbs from "./Breadcrumbs.jsx";

export default function PageHeader({ title, description, action, breadcrumbs, badge, tabs }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            <span className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-emerald-400 via-sky-400 to-indigo-500" aria-hidden="true" />
            <span className="truncate">{title}</span>
            {badge}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="min-w-0">{action}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </div>
  );
}
