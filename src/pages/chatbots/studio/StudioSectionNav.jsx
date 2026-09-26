import {
  FiCpu,
  FiMessageSquare,
  FiSmile,
  FiSliders,
  FiClipboard,
  FiGlobe,
  FiFeather,
} from "react-icons/fi";

const SECTIONS = [
  { key: "launcher", label: "Launcher", icon: FiCpu },
  { key: "chatWindow", label: "Chat Window", icon: FiMessageSquare },
  { key: "welcome", label: "Welcome", icon: FiSmile },
  { key: "behavior", label: "Behavior", icon: FiSliders },
  { key: "forms", label: "Forms", icon: FiClipboard },
  { key: "language", label: "Language", icon: FiGlobe },
  { key: "appearance", label: "Appearance", icon: FiFeather },
];

export default function StudioSectionNav({ active, onChange, orientation = "vertical" }) {
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={isHorizontal ? "flex gap-1 overflow-x-auto" : "space-y-0.5"}>
      {SECTIONS.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              isHorizontal ? "shrink-0" : "w-full"
            } ${
              isActive
                ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            }`}
          >
            <s.icon className="h-4 w-4 shrink-0" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

export { SECTIONS };
