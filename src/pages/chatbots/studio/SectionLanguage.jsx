import { FiInfo } from "react-icons/fi";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
];

export default function SectionLanguage({ value, onChange }) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Default language"
        options={LANGUAGE_OPTIONS}
        value={value.defaultLanguage}
        onChange={(v) => onChange("defaultLanguage", v)}
      />

      <div className="flex gap-2 rounded-lg bg-info-50 px-3 py-2.5 text-xs text-info-600 dark:bg-info-500/10 dark:text-info-500">
        <FiInfo className="h-4 w-4 shrink-0" />
        <p>Additional languages can be enabled in a future update.</p>
      </div>
    </div>
  );
}
