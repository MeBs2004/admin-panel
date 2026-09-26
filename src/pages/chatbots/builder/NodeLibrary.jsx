import { NODE_DEFS, NODE_LIBRARY_ORDER } from "./nodeDefs.js";

export default function NodeLibrary({ onAddNode, hasStart }) {
  return (
    <aside className="flex w-[210px] shrink-0 flex-col border-r border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <div className="border-b border-gray-100 px-3 py-2.5 dark:border-[var(--border)]">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Node library</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {NODE_LIBRARY_ORDER.map((type) => {
          const def = NODE_DEFS[type];
          const Icon = def.icon;
          const disabled = type === "start" && hasStart;
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onAddNode(type)}
              title={disabled ? "Only one Start node is allowed." : def.description}
              className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: def.color }}
              >
                <Icon className="h-3 w-3" />
              </span>
              {def.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
