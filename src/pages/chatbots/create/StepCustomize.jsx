import StudioWorkspace from "../../../components/studio/StudioWorkspace.jsx";

// Same editor + live preview as ChatbotStudio (one configuration
// surface, so create-time and edit-time can't drift). No server round
// trip yet: `config` is local wizard state, persisted to the real
// chatbot right after creation (see CreateChatbotWizard.handleCreate).
export default function StepCustomize({ config, setConfig, companyId }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Design your chatbot</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Every change appears instantly in the live preview — launcher, chat window, colors, motion and more.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" /> Live preview
        </span>
      </div>

      <div className="h-[min(760px,calc(100dvh-340px))] min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 dark:border-[var(--border)]">
        <StudioWorkspace className="h-full" config={config} onConfigChange={setConfig} companyId={companyId} engine="v1" />
      </div>
    </div>
  );
}
