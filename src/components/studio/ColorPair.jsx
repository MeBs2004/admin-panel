import ColorInput from "../ui/ColorInput.jsx";

// Colour field where "" means "derive automatically" (backend allows
// empty for these). Shows an Auto chip + reset instead of an error.
export default function OptionalColor({ label, value, onChange, autoHint = "Auto" }) {
  const isAuto = !value;
  return (
    <div>
      <ColorInput label={label} value={value || ""} onChange={onChange} allowEmpty />
      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
        <span>{isAuto ? `${autoHint} (follows theme)` : "Custom"}</span>
        {!isAuto && (
          <button type="button" onClick={() => onChange("")} className="font-medium text-primary-600 hover:underline dark:text-emerald-300">
            Reset to auto
          </button>
        )}
      </div>
    </div>
  );
}
