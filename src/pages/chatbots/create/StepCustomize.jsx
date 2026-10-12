import { useState } from "react";
import PreviewFrame from "../../../components/preview/PreviewFrame.jsx";
import StudioSectionNav from "../studio/StudioSectionNav.jsx";
import SectionLauncher from "../studio/SectionLauncher.jsx";
import SectionChatWindow from "../studio/SectionChatWindow.jsx";
import SectionWelcome from "../studio/SectionWelcome.jsx";
import SectionCTAs from "../studio/SectionCTAs.jsx";
import SectionSuggestions from "../studio/SectionSuggestions.jsx";
import SectionBehavior from "../studio/SectionBehavior.jsx";
import SectionForms from "../studio/SectionForms.jsx";
import SectionLanguage from "../studio/SectionLanguage.jsx";
import SectionAppearance from "../studio/SectionAppearance.jsx";

// Same canonical config schema and same section components as
// ChatbotStudio (Customize) — there is exactly one configuration
// editor, not a separate "create-time" one that could drift out of
// sync with it. The only difference here is there's no server round
// trip yet: `config`/`setConfig` is local wizard state, persisted to
// the real chatbot in one PATCH right after creation (see
// CreateChatbotWizard's handleCreate).
export default function StepCustomize({ config, setConfig, companyId }) {
  const [activeSection, setActiveSection] = useState("launcher");

  const updateField = (section, field, value) => {
    setConfig((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const updateArray = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Customize your chatbot
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The preview on the right is the real widget renderer — what you see is what visitors see.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:h-[560px] lg:flex-row">
        <div className="flex min-h-0 overflow-hidden rounded-lg border border-gray-200 lg:w-[380px] lg:shrink-0 dark:border-[var(--border)]">
          <div className="w-32 shrink-0 overflow-y-auto border-r border-gray-100 p-2 dark:border-[var(--border)]">
            <StudioSectionNav active={activeSection} onChange={setActiveSection} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeSection === "launcher" && (
              <SectionLauncher value={config.launcher} onChange={(f, v) => updateField("launcher", f, v)} />
            )}
            {activeSection === "chatWindow" && (
              <SectionChatWindow value={config.chatWindow} onChange={(f, v) => updateField("chatWindow", f, v)} />
            )}
            {activeSection === "welcome" && (
              <SectionWelcome
                value={config.chatWindow.welcomeMessage}
                onChange={(v) => updateField("chatWindow", "welcomeMessage", v)}
              />
            )}
            {activeSection === "ctas" && (
              <SectionCTAs value={config.ctas} onChange={(v) => updateArray("ctas", v)} />
            )}
            {activeSection === "suggestions" && (
              <SectionSuggestions value={config.suggestions} onChange={(v) => updateArray("suggestions", v)} />
            )}
            {activeSection === "behavior" && (
              <SectionBehavior value={config.behavior} onChange={(f, v) => updateField("behavior", f, v)} />
            )}
            {activeSection === "forms" && (
              <SectionForms value={config.forms} onChange={(f, v) => updateField("forms", f, v)} />
            )}
            {activeSection === "language" && (
              <SectionLanguage value={config.language} onChange={(f, v) => updateField("language", f, v)} />
            )}
            {activeSection === "appearance" && (
              <SectionAppearance value={config.appearance} onChange={(f, v) => updateField("appearance", f, v)} />
            )}
          </div>
        </div>

        <div className="min-h-[360px] flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-[var(--border)] dark:bg-black/10">
          <PreviewFrame config={config} companyId={companyId} />
        </div>
      </div>
    </div>
  );
}
