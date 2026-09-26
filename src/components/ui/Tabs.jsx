export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-[var(--border)]">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "text-primary-500"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {tab.label}
            <span
              className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-500 transition-transform duration-200 ease-out ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
