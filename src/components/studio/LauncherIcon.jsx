import { ICON_PATHS } from "../../config/widgetStyle.js";

// One glyph from the shared icon set (same paths the real launcher draws).
export default function LauncherIcon({ name = "default", size = 24, color = "currentColor", className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true" className={className}>
      <path d={ICON_PATHS[name] || ICON_PATHS.default} />
    </svg>
  );
}
