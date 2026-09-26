import Toggle from "../../../components/ui/Toggle.jsx";
import ColorInput from "../../../components/ui/ColorInput.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import Input from "../../../components/ui/Input.jsx";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const RADIUS_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export default function SectionChatWindow({ value, onChange }) {
  return (
    <div className="space-y-6">
      <SegmentedControl
        label="Theme"
        options={THEME_OPTIONS}
        value={value.theme}
        onChange={(v) => onChange("theme", v)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ColorInput
          label="Primary Color"
          value={value.primaryColor}
          onChange={(v) => onChange("primaryColor", v)}
        />
        <ColorInput
          label="Background Color"
          value={value.backgroundColor}
          onChange={(v) => onChange("backgroundColor", v)}
        />
        <ColorInput
          label="Text Color"
          value={value.textColor}
          onChange={(v) => onChange("textColor", v)}
        />
      </div>

      <SegmentedControl
        label="Window Size"
        options={SIZE_OPTIONS}
        value={value.size}
        onChange={(v) => onChange("size", v)}
      />

      <SegmentedControl
        label="Corner Radius"
        options={RADIUS_OPTIONS}
        value={value.borderRadius}
        onChange={(v) => onChange("borderRadius", v)}
      />

      <hr className="border-gray-100 dark:border-white/5" />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Branding
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Bot Name"
              placeholder="AI Assistant"
              value={value.botName}
              maxLength={60}
              onChange={(e) => onChange("botName", e.target.value)}
            />
            <Input
              label="Company Name"
              value={value.companyName}
              maxLength={60}
              onChange={(e) => onChange("companyName", e.target.value)}
            />
          </div>
          <Input
            label="Bot Avatar URL (optional)"
            placeholder="https://..."
            value={value.botAvatar}
            onChange={(e) => onChange("botAvatar", e.target.value)}
          />
          <Toggle
            label='Show "Powered by Nuformly"'
            checked={value.showBranding}
            onChange={(v) => onChange("showBranding", v)}
          />
        </div>
      </div>
    </div>
  );
}
