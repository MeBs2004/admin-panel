import { FiArrowLeft, FiRotateCcw, FiRotateCw, FiZoomIn, FiZoomOut, FiMaximize, FiCheckCircle, FiClock } from "react-icons/fi";
import Button from "../../../components/ui/Button.jsx";

export default function BuilderToolbar({
  chatbotName,
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onValidate,
  validating,
  saveState, // "saved" | "saving" | "unsaved"
  lastSavedAt,
  onSaveDraft,
  saving,
  onPublish,
  publishing,
  publishedVersion,
  onOpenHistory,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <FiArrowLeft className="h-4 w-4" /> Chatbots
        </button>
        <div className="h-5 w-px bg-gray-200 dark:bg-white/10" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bot Builder</p>
          <p className="text-xs text-gray-400">{chatbotName}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"
        >
          <FiRotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"
        >
          <FiRotateCw className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-white/10" />
        <button onClick={onZoomOut} title="Zoom out" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          <FiZoomOut className="h-4 w-4" />
        </button>
        <button onClick={onZoomIn} title="Zoom in" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          <FiZoomIn className="h-4 w-4" />
        </button>
        <button onClick={onFitView} title="Fit view" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          <FiMaximize className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs">
          {saveState === "saving" ? (
            <span className="text-gray-400">Saving...</span>
          ) : saveState === "unsaved" ? (
            <span className="font-medium text-warning-600 dark:text-warning-500">Unsaved changes</span>
          ) : lastSavedAt ? (
            <span className="text-gray-400">Last saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
          ) : (
            <span className="text-gray-400">Saved</span>
          )}
        </div>

        <button
          onClick={onOpenHistory}
          title="Version history"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <FiClock className="h-4 w-4" />
        </button>
        <Button variant="secondary" onClick={onValidate} loading={validating}>
          <FiCheckCircle className="h-3.5 w-3.5" /> Validate
        </Button>
        <Button variant="secondary" onClick={onSaveDraft} loading={saving}>
          Save Draft
        </Button>
        <Button onClick={onPublish} loading={publishing}>
          Publish{publishedVersion ? ` (v${publishedVersion} live)` : ""}
        </Button>
      </div>
    </div>
  );
}
