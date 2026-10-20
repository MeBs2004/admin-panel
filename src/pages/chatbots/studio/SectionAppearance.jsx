import { useEffect } from "react";
import { FiType, FiCode } from "react-icons/fi";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import FieldGroup from "../../../components/studio/FieldGroup.jsx";
import OptionTiles from "../../../components/studio/OptionTiles.jsx";
import { FONT_STACKS, fontStylesheetUrl } from "../../../config/widgetStyle.js";

const FONTS = [
  { value: "system", label: "System" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "nunito", label: "Nunito" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "merriweather", label: "Merriweather" },
  { value: "mono", label: "Mono" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// Load every font once so each tile can render its own sample.
function useFontPreviews() {
  useEffect(() => {
    FONTS.forEach(({ value }) => {
      const href = fontStylesheetUrl(value);
      if (!href || document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);
}

export default function SectionAppearance({ value, onChange }) {
  useFontPreviews();
  const fontOptions = FONTS.map((f) => ({
    ...f,
    visual: <span className="text-xl font-semibold text-gray-800 dark:text-gray-100" style={{ fontFamily: FONT_STACKS[f.value] }}>Aa</span>,
  }));

  return (
    <div className="space-y-4">
      <FieldGroup title="Typography" icon={FiType} description="Font family and text size">
        <OptionTiles label="Font" options={fontOptions} value={value.font} onChange={(v) => onChange("font", v)} columns={4} />
        <SegmentedControl label="Text size" options={SIZE_OPTIONS} value={value.fontSize} onChange={(v) => onChange("fontSize", v)} />
      </FieldGroup>

      <FieldGroup title="Custom CSS" icon={FiCode} description="Advanced — sandboxed to the chatbot" defaultOpen={false}>
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom CSS</span>
            <span className="rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-medium text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">Advanced</span>
          </div>
          <textarea
            rows={6}
            maxLength={4000}
            placeholder=".nuformly-widget { /* custom styles */ }"
            value={value.customCss}
            onChange={(e) => onChange("customCss", e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:border-[var(--border)] dark:bg-white/5 dark:text-gray-100"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Applied live in the preview, sandboxed so it can only ever style the chatbot preview — never the rest of this admin
            panel. Rules targeting <code>body</code>, <code>html</code>, or <code>:root</code> are dropped rather than applied.
          </p>
        </div>
      </FieldGroup>
    </div>
  );
}
