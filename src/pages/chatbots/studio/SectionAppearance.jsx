import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";

const FONT_OPTIONS = [
  { value: "system", label: "System" },
  { value: "inter", label: "Inter" },
];

export default function SectionAppearance({ value, onChange }) {
  return (
    <div className="space-y-6">
      <SegmentedControl
        label="Font"
        options={FONT_OPTIONS}
        value={value.font}
        onChange={(v) => onChange("font", v)}
      />

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom CSS
          </span>
          <span className="rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-medium text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
            Advanced
          </span>
        </div>
        <textarea
          rows={6}
          maxLength={4000}
          placeholder=".nuformly-widget { /* custom styles */ }"
          value={value.customCss}
          onChange={(e) => onChange("customCss", e.target.value)}
          spellCheck={false}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-white/5 dark:text-gray-100 dark:border-[var(--border)]"
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Applied live in the previews below, sandboxed so it can only
          ever style the chatbot preview — never the rest of this admin
          panel. Rules targeting <code>body</code>, <code>html</code>,
          or <code>:root</code> are dropped rather than applied.
        </p>
      </div>
    </div>
  );
}
