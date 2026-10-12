import { FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../../../components/ui/Select.jsx";
import Input from "../../../components/ui/Input.jsx";
import Toggle from "../../../components/ui/Toggle.jsx";
import Button from "../../../components/ui/Button.jsx";
import { CTA_TYPE_OPTIONS, MAX_CTAS } from "../../../config/chatbotConfigDefaults.js";

const VALUE_LABEL = {
  call: "Phone number",
  whatsapp: "WhatsApp number",
  email: "Email address",
  custom: "Link URL",
};

const VALUE_PLACEHOLDER = {
  call: "+1 555 123 4567",
  whatsapp: "+1 555 123 4567",
  email: "hello@yourcompany.com",
  custom: "https://yourcompany.com/book-a-call",
};

const DEFAULT_LABEL = { call: "Call", whatsapp: "WhatsApp", email: "Email", custom: "Learn More" };

// `value` here is the array itself (config.ctas), not a sub-object —
// SectionCTAs is one of the few sections whose onChange replaces the
// whole array in one call, same convention SectionForms already uses
// for `forms.fields`.
export default function SectionCTAs({ value = [], onChange }) {
  const ctas = value;

  const update = (index, patch) => {
    onChange(ctas.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const remove = (index) => {
    onChange(ctas.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...ctas, { type: "call", enabled: true, label: DEFAULT_LABEL.call, value: "" }]);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">CTA Buttons</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Quick-action buttons shown above the welcome message — Call, WhatsApp, Email, or a custom link.
        </p>
      </div>

      <div className="space-y-4">
        {ctas.length === 0 && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:bg-white/5">
            No CTA buttons yet. Add one below.
          </p>
        )}

        {ctas.map((cta, index) => (
          <div key={index} className="space-y-2.5 rounded-lg border border-gray-200 p-3 dark:border-[var(--border)]">
            <div className="flex items-center justify-between gap-2">
              <div className="w-36">
                <Select
                  options={CTA_TYPE_OPTIONS}
                  value={cta.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    update(index, { type, label: cta.label || DEFAULT_LABEL[type] });
                  }}
                />
              </div>
              <Toggle checked={cta.enabled} onChange={(v) => update(index, { enabled: v })} />
              <button
                onClick={() => remove(index)}
                className="text-gray-400 hover:text-danger-500"
                aria-label="Remove CTA"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
            <Input
              label="Button label"
              value={cta.label}
              maxLength={40}
              onChange={(e) => update(index, { label: e.target.value })}
            />
            <Input
              label={VALUE_LABEL[cta.type]}
              placeholder={VALUE_PLACEHOLDER[cta.type]}
              value={cta.value}
              maxLength={300}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          </div>
        ))}

        <Button variant="secondary" onClick={add} disabled={ctas.length >= MAX_CTAS}>
          <FiPlus className="h-3.5 w-3.5" /> Add CTA Button
        </Button>
        {ctas.length >= MAX_CTAS && (
          <p className="text-xs text-gray-400">Maximum of {MAX_CTAS} buttons.</p>
        )}
      </div>
    </div>
  );
}
