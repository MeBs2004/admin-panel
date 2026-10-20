import { FiMaximize2, FiRotateCcw } from "react-icons/fi";
import FieldGroup from "./FieldGroup.jsx";
import SizeSlider from "./SizeSlider.jsx";
import { SIZE_GROUPS } from "../../config/sizeOptions.js";
import { SIZE_RANGES } from "../../config/widgetStyle.js";

/**
 * A collapsible group of size sliders for one part of the chatbot
 * (see config/sizeOptions.js). Edits go through the same
 * onConfigChange path as every other option, so the preview updates live.
 */
export default function SizeFields({ group, config, onField, defaultOpen = false }) {
  const spec = SIZE_GROUPS[group];
  const get = (path) => {
    const [section, key] = path.split(".");
    return config[section]?.[key] ?? null;
  };
  const anySet = spec.items.some((it) => get(it.path) !== null);
  const resetAll = () =>
    spec.items.forEach((it) => {
      const [section, key] = it.path.split(".");
      onField(section, key, null);
    });

  return (
    <FieldGroup title={spec.title} icon={FiMaximize2} description={spec.description} defaultOpen={defaultOpen}>
      {spec.items.map((it) => {
        const [min, max] = SIZE_RANGES[it.path];
        const [section, key] = it.path.split(".");
        return (
          <SizeSlider
            key={it.path}
            label={it.label}
            hint={it.hint}
            value={get(it.path)}
            min={min}
            max={max}
            auto={it.auto}
            step={it.step}
            unit={it.unit}
            onChange={(v) => onField(section, key, v)}
          />
        );
      })}
      {anySet && (
        <button
          type="button"
          onClick={resetAll}
          className="section-in inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary-600"
        >
          <FiRotateCcw className="h-3 w-3" /> Reset these to automatic
        </button>
      )}
    </FieldGroup>
  );
}
