import Toggle from "../../../components/ui/Toggle.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import { ALLOWED_FORM_FIELDS } from "../../../config/chatbotConfigDefaults.js";

const STYLE_OPTIONS = [
  { value: "classic", label: "Classic" },
  { value: "conversational", label: "Conversational" },
];

export default function SectionForms({ value, onChange }) {
  const toggleField = (field) => {
    const fields = value.fields.includes(field)
      ? value.fields.filter((f) => f !== field)
      : [...value.fields, field];
    onChange("fields", fields);
  };

  return (
    <div className="space-y-6">
      <Toggle
        label="Enable pre-chat form"
        description="Ask visitors for information before starting a conversation."
        checked={value.enabled}
        onChange={(v) => onChange("enabled", v)}
      />

      <fieldset disabled={!value.enabled} className="space-y-6 disabled:opacity-40">
        <SegmentedControl
          label="Form style"
          options={STYLE_OPTIONS}
          value={value.style}
          onChange={(v) => onChange("style", v)}
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fields to collect
          </span>
          <div className="space-y-2">
            {ALLOWED_FORM_FIELDS.map((f) => (
              <label
                key={f.value}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={value.fields.includes(f.value)}
                  onChange={() => toggleField(f.value)}
                  className="rounded"
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:bg-white/5">
        Custom fields beyond Name/Email/Phone/Company are coming in a future
        update.
      </p>
    </div>
  );
}
