import {
  FiCpu,
  FiMessageSquare,
  FiSmile,
  FiSliders,
  FiClipboard,
  FiGlobe,
  FiFeather,
  FiPhoneCall,
  FiHelpCircle,
  FiDroplet,
  FiEdit3,
} from "react-icons/fi";

const SECTIONS = [
  { key: "themes", label: "Themes", icon: FiDroplet },
  { key: "launcher", label: "Launcher", icon: FiCpu },
  { key: "chatWindow", label: "Chat Window", icon: FiMessageSquare },
  { key: "welcome", label: "Welcome", icon: FiSmile },
  { key: "ctas", label: "CTA Buttons", icon: FiPhoneCall },
  { key: "suggestions", label: "Suggestions", icon: FiHelpCircle },
  { key: "appearance", label: "Typography", icon: FiFeather },
  { key: "labels", label: "Texts & labels", icon: FiEdit3 },
  { key: "behavior", label: "Behavior", icon: FiSliders },
  { key: "forms", label: "Forms", icon: FiClipboard },
  { key: "language", label: "Language", icon: FiGlobe },
];

export default function StudioSectionNav({ active, onChange, orientation = "vertical" }) {
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={isHorizontal ? "flex gap-1.5 overflow-x-auto px-2 py-2" : "space-y-1"}>
      {SECTIONS.map((s, i) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            style={{ "--stagger-index": i }}
            className={`stagger-in group relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
              isHorizontal ? "shrink-0" : "w-full"
            } ${
              isActive
                ? "bg-gradient-to-r from-primary-50 to-transparent text-primary-600 shadow-[inset_0_0_0_1px_rgba(26,138,86,0.18)] dark:from-primary-500/20 dark:text-emerald-200"
                : "text-gray-600 hover:bg-gray-50 hover:pl-4 dark:text-gray-300 dark:hover:bg-white/5"
            }`}
          >
            {isActive && !isHorizontal && (
              <span className="absolute left-0 h-5 w-1 rounded-r-full bg-gradient-to-b from-emerald-400 to-indigo-500" />
            )}
            <s.icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary-500 dark:text-emerald-300" : ""}`} />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

export { SECTIONS };
