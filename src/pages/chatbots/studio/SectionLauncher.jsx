import Toggle from "../../../components/ui/Toggle.jsx";
import ColorInput from "../../../components/ui/ColorInput.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import Input from "../../../components/ui/Input.jsx";

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
];
const SHAPE_OPTIONS = [
  { value: "circle", label: "Circle" },
  { value: "rounded-square", label: "Rounded Square" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const ICON_OPTIONS = [
  { value: "default", label: "Default AI Icon" },
  { value: "chat", label: "Chat Icon" },
  { value: "logo", label: "Company Logo" },
];
const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "float", label: "Float" },
  { value: "pulse", label: "Pulse" },
  { value: "glow", label: "Soft Glow" },
];

export default function SectionLauncher({ value, onChange }) {
  return (
    <div className="space-y-6">
      <Toggle
        label="Launcher enabled"
        description="Turn the chat launcher off to hide the chatbot entirely."
        checked={value.enabled}
        onChange={(v) => onChange("enabled", v)}
      />

      <fieldset disabled={!value.enabled} className="space-y-6 disabled:opacity-40">
        <SegmentedControl
          label="Position"
          options={POSITION_OPTIONS}
          value={value.position}
          onChange={(v) => onChange("position", v)}
        />

        <SegmentedControl
          label="Shape"
          options={SHAPE_OPTIONS}
          value={value.shape}
          onChange={(v) => onChange("shape", v)}
        />

        <SegmentedControl
          label="Size"
          options={SIZE_OPTIONS}
          value={value.size}
          onChange={(v) => onChange("size", v)}
        />

        <SegmentedControl
          label="Icon"
          options={ICON_OPTIONS}
          value={value.icon}
          onChange={(v) => onChange("icon", v)}
        />

        <SegmentedControl
          label="Animation"
          options={ANIMATION_OPTIONS}
          value={value.animation}
          onChange={(v) => onChange("animation", v)}
        />

        <div>
          <Toggle
            label="Use gradient"
            checked={value.gradient.enabled}
            onChange={(v) => onChange("gradient", { ...value.gradient, enabled: v })}
          />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {value.gradient.enabled ? (
              <>
                <ColorInput
                  label="Gradient Start"
                  value={value.gradient.from}
                  onChange={(v) => onChange("gradient", { ...value.gradient, from: v })}
                />
                <ColorInput
                  label="Gradient End"
                  value={value.gradient.to}
                  onChange={(v) => onChange("gradient", { ...value.gradient, to: v })}
                />
              </>
            ) : (
              <ColorInput
                label="Launcher Color"
                value={value.color}
                onChange={(v) => onChange("color", v)}
              />
            )}
          </div>
        </div>

        <Toggle
          label="Show on mobile"
          checked={value.showOnMobile}
          onChange={(v) => onChange("showOnMobile", v)}
        />

        <hr className="border-gray-100 dark:border-white/5" />

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
            Greeting bubble
          </h3>
          <div className="space-y-4">
            <Toggle
              label="Show greeting"
              checked={value.showGreeting}
              onChange={(v) => onChange("showGreeting", v)}
            />
            {value.showGreeting && (
              <>
                <Input
                  label="Title"
                  value={value.greetingTitle}
                  maxLength={60}
                  onChange={(e) => onChange("greetingTitle", e.target.value)}
                />
                <Input
                  label="Message"
                  value={value.greetingMessage}
                  maxLength={160}
                  onChange={(e) => onChange("greetingMessage", e.target.value)}
                />
              </>
            )}
            <Toggle
              label="Show notification badge"
              checked={value.showNotificationBadge}
              onChange={(v) => onChange("showNotificationBadge", v)}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
