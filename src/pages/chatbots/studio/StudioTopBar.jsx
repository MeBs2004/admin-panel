import { FiArrowLeft, FiCheck, FiMonitor, FiTablet, FiSmartphone } from "react-icons/fi";
import Button from "../../../components/ui/Button.jsx";

const DEVICES = [
  { value: "desktop", icon: FiMonitor, label: "Desktop" },
  { value: "tablet", icon: FiTablet, label: "Tablet" },
  { value: "mobile", icon: FiSmartphone, label: "Mobile" },
];

export default function StudioTopBar({
  chatbotName,
  companyName,
  onBack,
  hasChanges,
  justSaved,
  saving,
  onSave,
  deviceMode,
  onDeviceModeChange,
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:bg-[var(--surface)]/90 dark:border-[var(--border)] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <FiArrowLeft className="h-4 w-4" /> Chatbots
        </button>
        <div className="h-5 w-px bg-gray-200 dark:bg-white/10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {chatbotName}
          </p>
          {companyName && (
            <p className="truncate text-xs text-gray-400">{companyName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-[var(--border)] dark:bg-white/5 md:flex">
          {DEVICES.map((d) => (
            <button
              key={d.value}
              onClick={() => onDeviceModeChange(d.value)}
              title={d.label}
              aria-label={d.label}
              className={`rounded-md p-1.5 transition-colors duration-150 ${
                deviceMode === d.value
                  ? "bg-white text-primary-600 shadow-sm dark:bg-[var(--surface)] dark:text-primary-300"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
            >
              <d.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {justSaved ? (
            <span className="flex animate-fade-in items-center gap-1 font-medium text-success-600 dark:text-success-500">
              <FiCheck className="h-3.5 w-3.5" /> Saved just now
            </span>
          ) : hasChanges ? (
            <span className="flex items-center gap-1.5 font-medium text-warning-600 dark:text-warning-500">
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Unsaved changes
            </span>
          ) : (
            <span className="text-gray-400">Saved</span>
          )}
        </div>

        <Button onClick={onSave} loading={saving} disabled={!hasChanges}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
