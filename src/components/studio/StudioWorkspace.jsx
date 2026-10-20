import { useEffect, useRef, useState } from "react";
import { FiSliders, FiEye } from "react-icons/fi";
import PreviewFrame from "../preview/PreviewFrame.jsx";
import StudioSectionNav from "../../pages/chatbots/studio/StudioSectionNav.jsx";
import SectionThemes, { applyPreset } from "../../pages/chatbots/studio/SectionThemes.jsx";
import SectionLauncher from "../../pages/chatbots/studio/SectionLauncher.jsx";
import SectionChatWindow from "../../pages/chatbots/studio/SectionChatWindow.jsx";
import SectionWelcome from "../../pages/chatbots/studio/SectionWelcome.jsx";
import SectionCTAs from "../../pages/chatbots/studio/SectionCTAs.jsx";
import SectionSuggestions from "../../pages/chatbots/studio/SectionSuggestions.jsx";
import SectionBehavior from "../../pages/chatbots/studio/SectionBehavior.jsx";
import SectionForms from "../../pages/chatbots/studio/SectionForms.jsx";
import SectionLanguage from "../../pages/chatbots/studio/SectionLanguage.jsx";
import SectionAppearance from "../../pages/chatbots/studio/SectionAppearance.jsx";
import SizeFields from "./SizeFields.jsx";
import SectionLabels from "../../pages/chatbots/studio/SectionLabels.jsx";
import { sectionForField } from "../../config/editTargets.js";

// Which preview tab each section belongs on, so editing something
// always brings the thing you're editing into view.
const FOCUS = { launcher: "widget", behavior: "widget", themes: null };

/**
 * The one editor + live preview used by BOTH the Studio page and the
 * Create Chatbot wizard — a single configuration surface, so the two
 * can never drift. `onConfigChange(updater)` receives a function
 * (prev) => next; the caller owns the state (and any dirty tracking).
 * Every edit re-renders the preview on the same tick — no save needed.
 */
export default function StudioWorkspace({
  config,
  onConfigChange,
  companyId,
  engine = "v1",
  deviceMode = "desktop",
  footer = null,
  className = "",
}) {
  const [activeSection, setActiveSection] = useState("themes");
  const [mobileTab, setMobileTab] = useState("customize");
  const panelRef = useRef(null);
  const [focusReq, setFocusReq] = useState(null);

  const updateField = (section, field, value) =>
    onConfigChange((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  const updateArray = (key, value) => onConfigChange((prev) => ({ ...prev, [key]: value }));
  // Size sliders — shown right under the section they belong to.
  const sizes = (group, defaultOpen = false) => (
    <div className="mt-4">
      <SizeFields group={group} config={config} onField={updateField} defaultOpen={defaultOpen} />
    </div>
  );

  const focus = activeSection in FOCUS ? FOCUS[activeSection] : "window";

  // Click to edit: an element in the preview names the setting that controls it.
  // Switch to that section, then open, scroll to and flash the control.
  const handleEdit = (id) => {
    setActiveSection(sectionForField(id));
    setMobileTab("customize");
    setFocusReq({ id, n: Date.now() });
  };
  useEffect(() => {
    if (!focusReq) return undefined;
    const timers = [];
    timers.push(
      setTimeout(() => {
        const root = panelRef.current;
        if (!root) return;
        const find = (id) => root.querySelector(`[data-field="${CSS.escape(id)}"]`);
        let el = find(focusReq.id);
        if (!el && focusReq.id.includes(".")) el = find(focusReq.id.split(".")[0]); // ctas.2 -> ctas
        if (!el) return;
        // open any collapsed group around it
        let group = el.closest("section");
        while (group) {
          const toggle = group.querySelector(":scope > button[aria-expanded='false']");
          if (toggle) toggle.click();
          group = group.parentElement?.closest("section") || null;
        }
        timers.push(
          setTimeout(() => {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
            el.classList.remove("studio-flash");
            void el.offsetWidth;
            el.classList.add("studio-flash");
            timers.push(setTimeout(() => el.classList.remove("studio-flash"), 1500));
            el.querySelector("input:not([type=file]),textarea,select,button")?.focus({ preventScroll: true });
          }, 340),
        );
      }, 60),
    );
    return () => timers.forEach(clearTimeout);
  }, [focusReq]);

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="flex shrink-0 justify-center gap-1 border-b border-gray-100 bg-white px-4 py-2 dark:border-[var(--border)] dark:bg-[var(--surface)] lg:hidden">
        {[
          { key: "customize", label: "Customize", icon: FiSliders },
          { key: "preview", label: "Preview", icon: FiEye },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMobileTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
              mobileTab === t.key ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200" : "text-gray-500"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Configuration panel */}
        <div
          className={`min-h-0 w-full shrink-0 flex-col border-r border-gray-100 bg-white dark:border-[var(--border)] dark:bg-[var(--surface)] lg:flex lg:w-[500px] ${
            mobileTab === "customize" ? "flex" : "hidden"
          }`}
        >
          <div className="shrink-0 border-b border-gray-100 dark:border-[var(--border)] lg:hidden">
            <StudioSectionNav active={activeSection} onChange={setActiveSection} orientation="horizontal" />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="hidden w-44 shrink-0 overflow-y-auto border-r border-gray-100 p-2 dark:border-[var(--border)] lg:block">
              <StudioSectionNav active={activeSection} onChange={setActiveSection} />
            </div>
            <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto p-4">
              <div key={activeSection} className="section-in">
                {activeSection === "themes" && (
                  <SectionThemes config={config} onApply={(preset) => onConfigChange((prev) => applyPreset(prev, preset.patch))} />
                )}
                {activeSection === "launcher" && (
                  <>
                    <SectionLauncher value={config.launcher} onChange={(f, v) => updateField("launcher", f, v)} />
                    {sizes("launcher")}
                  </>
                )}
                {activeSection === "chatWindow" && (
                  <>
                    <SectionChatWindow value={config.chatWindow} onChange={(f, v) => updateField("chatWindow", f, v)} />
                    {sizes("window")}
                    {sizes("header")}
                    {sizes("messages")}
                    {sizes("input")}
                  </>
                )}
                {activeSection === "welcome" && (
                  <>
                    <SectionWelcome
                      value={config.chatWindow.welcomeMessage}
                      onChange={(v) => updateField("chatWindow", "welcomeMessage", v)}
                      hindi={config.chatWindow.welcomeMessageHindi}
                      onHindiChange={(v) => updateField("chatWindow", "welcomeMessageHindi", v)}
                      show={config.chatWindow.showWelcome}
                      onShowChange={(v) => updateField("chatWindow", "showWelcome", v)}
                    />
                    {sizes("welcome", true)}
                  </>
                )}
                {activeSection === "ctas" && (
                  <>
                    <SectionCTAs
                      value={config.ctas}
                      onChange={(v) => updateArray("ctas", v)}
                      show={config.chatWindow.showCtas}
                      onShowChange={(v) => updateField("chatWindow", "showCtas", v)}
                    />
                    {sizes("cta", true)}
                  </>
                )}
                {activeSection === "suggestions" && (
                  <>
                    <SectionSuggestions
                      value={config.suggestions}
                      onChange={(v) => updateArray("suggestions", v)}
                      show={config.chatWindow.showSuggestions}
                      onShowChange={(v) => updateField("chatWindow", "showSuggestions", v)}
                    />
                    {sizes("suggestions", true)}
                  </>
                )}
                {activeSection === "behavior" && <SectionBehavior value={config.behavior} onChange={(f, v) => updateField("behavior", f, v)} />}
                {activeSection === "forms" && (
                  <>
                    <SectionForms value={config.forms} onChange={(f, v) => updateField("forms", f, v)} />
                    {sizes("forms", true)}
                  </>
                )}
                {activeSection === "labels" && <SectionLabels value={config.chatWindow} onChange={(f, v) => updateField("chatWindow", f, v)} />}
                {activeSection === "language" && <SectionLanguage value={config.language} onChange={(f, v) => updateField("language", f, v)} />}
                {activeSection === "appearance" && (
                  <>
                    <SectionAppearance value={config.appearance} onChange={(f, v) => updateField("appearance", f, v)} />
                    {sizes("type", true)}
                  </>
                )}
              </div>
              {footer}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div
          className={`min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-emerald-50/40 dark:from-black/10 dark:to-black/20 lg:block ${
            mobileTab === "preview" ? "block" : "hidden"
          }`}
        >
          <PreviewFrame config={config} deviceMode={deviceMode} companyId={companyId} engine={engine} focus={focus} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
}
