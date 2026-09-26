import Toggle from "../../../components/ui/Toggle.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";

const OFFLINE_OPTIONS = [
  { value: "default", label: "Always available" },
  { value: "offline-message", label: "Show offline message" },
];

export default function SectionBehavior({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <Toggle
          label="Auto-open chat window"
          description="Automatically opens the chat window for new visitors."
          checked={value.autoOpen}
          onChange={(v) => onChange("autoOpen", v)}
        />
        {value.autoOpen && (
          <div className="mt-3 max-w-xs">
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Delay</span>
              <span className="text-xs text-gray-400">{value.autoOpenDelay}s</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={value.autoOpenDelay}
              onChange={(e) => onChange("autoOpenDelay", Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Reflected live in both previews below and on your public widget
          once saved.
        </p>
      </div>

      <hr className="border-gray-100 dark:border-white/5" />

      <Toggle
        label="Sound"
        description="Play a sound when a new message arrives."
        checked={value.sound}
        onChange={(v) => onChange("sound", v)}
      />

      <Toggle
        label="Typing indicator"
        description="Show animated dots while the bot is responding."
        checked={value.typingIndicator}
        onChange={(v) => onChange("typingIndicator", v)}
      />

      <SegmentedControl
        label="When offline"
        options={OFFLINE_OPTIONS}
        value={value.offlineMode}
        onChange={(v) => onChange("offlineMode", v)}
      />
    </div>
  );
}
