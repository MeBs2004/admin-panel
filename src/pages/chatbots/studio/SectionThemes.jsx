import { FiCheck } from "react-icons/fi";
import { THEME_PRESETS } from "../../../config/widgetStyle.js";
import LauncherIcon from "../../../components/studio/LauncherIcon.jsx";

// Deep-merge a preset patch onto the current config, touching only
// the colour/styling fields the preset names.
export function applyPreset(config, patch) {
  const out = { ...config };
  for (const section of Object.keys(patch)) {
    out[section] = { ...config[section] };
    for (const [key, val] of Object.entries(patch[section])) {
      out[section][key] = val && typeof val === "object" ? { ...config[section][key], ...val } : val;
    }
  }
  return out;
}

const isActive = (config, preset) =>
  config.chatWindow.primaryColor.toLowerCase() === preset.patch.chatWindow.primaryColor.toLowerCase() &&
  config.chatWindow.theme === preset.patch.chatWindow.theme;

export default function SectionThemes({ config, onApply }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Theme presets</h3>
        <p className="mt-1 text-xs text-gray-400">
          One click restyles the launcher and the chat window. Fine-tune anything afterwards in the other sections.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEME_PRESETS.map((preset, i) => {
          const active = isActive(config, preset);
          const dark = preset.patch.chatWindow.theme === "dark";
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(preset)}
              style={{ "--stagger-index": i }}
              className={`stagger-in group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-95 ${
                active ? "border-primary-400 ring-2 ring-primary-400/40" : "border-gray-200 dark:border-[var(--border)]"
              }`}
            >
              {/* Mini window mock */}
              <div className="overflow-hidden rounded-xl border border-black/5" style={{ background: preset.patch.chatWindow.backgroundColor }}>
                <div
                  className="flex items-center gap-1.5 px-2 py-1.5"
                  style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})` }}
                >
                  <span className="h-3 w-3 rounded-full bg-white/40" />
                  <span className="h-1.5 w-10 rounded-full bg-white/70" />
                </div>
                <div className="space-y-1 p-2">
                  <span className="block h-2.5 w-3/4 rounded-full" style={{ background: preset.patch.chatWindow.botBubbleColor || (dark ? "#232d27" : "#F3F4F6") }} />
                  <span className="ml-auto block h-2.5 w-1/2 rounded-full" style={{ background: preset.patch.chatWindow.userBubbleColor || preset.swatch[0] }} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{preset.name}</span>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})` }}
                >
                  <LauncherIcon name="chat" size={12} color="#fff" />
                </span>
              </div>
              {active && (
                <span className="pop-in absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white shadow">
                  <FiCheck className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
