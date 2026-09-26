import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../../services/api.js";
import { subscribeChatbot } from "../../../services/realtime.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { DEFAULT_CHATBOT_CONFIG } from "../../../config/chatbotConfigDefaults.js";
import Button from "../../../components/ui/Button.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import PreviewFrame from "../../../components/preview/PreviewFrame.jsx";
import StudioTopBar from "./StudioTopBar.jsx";
import StudioSectionNav from "./StudioSectionNav.jsx";
import SectionLauncher from "./SectionLauncher.jsx";
import SectionChatWindow from "./SectionChatWindow.jsx";
import SectionWelcome from "./SectionWelcome.jsx";
import SectionBehavior from "./SectionBehavior.jsx";
import SectionForms from "./SectionForms.jsx";
import SectionLanguage from "./SectionLanguage.jsx";
import SectionAppearance from "./SectionAppearance.jsx";

export default function ChatbotStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [chatbot, setChatbot] = useState(null);
  const [company, setCompany] = useState(null);
  const [serverConfig, setServerConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("launcher");
  const [deviceMode, setDeviceMode] = useState("desktop");
  const [mobileTab, setMobileTab] = useState("customize");
  const [confirmReset, setConfirmReset] = useState(false);
  const [conflict, setConflict] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}`)
      .then((res) => {
        setChatbot(res.data.chatbot);
        setCompany(res.data.company);
        setServerConfig(res.data.chatbot.config);
        setDraftConfig(res.data.chatbot.config);
        setConflict(false);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const hasChanges =
    !loading && draftConfig && JSON.stringify(draftConfig) !== JSON.stringify(serverConfig);

  // Multi-tab / another-admin conflict detection (Section 33/34): a
  // ref because the socket subscription below is set up once per
  // chatbot id, not re-subscribed every render, but still needs the
  // CURRENT hasChanges value when an event actually arrives.
  const hasChangesRef = useRef(hasChanges);
  hasChangesRef.current = hasChanges;

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeChatbot(id, (evt) => {
      if (evt.type !== "chatbot.config.updated" && evt.type !== "chatbot.updated") return;

      if (hasChangesRef.current) {
        // Never silently discard unsaved work — just flag it. The
        // admin decides when to reload (Reset to defaults still
        // works, or they can finish and Save, accepting they may
        // overwrite the other change).
        setConflict(true);
      } else {
        load();
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = (section, field, value) => {
    setJustSaved(false);
    setDraftConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/chatbots/${id}/config`, { config: draftConfig });
      setServerConfig(res.data.config);
      setDraftConfig(res.data.config);
      setJustSaved(true);
      setConflict(false);
      showToast("Chatbot configuration saved.");
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraftConfig(DEFAULT_CHATBOT_CONFIG);
    setJustSaved(false);
    setConfirmReset(false);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        <SkeletonLine className="h-6 w-64" />
        <SkeletonLine className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!chatbot) return null;

  return (
    // This page is a standalone top-level route (see App.jsx — declared
    // outside <AdminLayout>, no sidebar/header above it), so h-screen
    // here is correct and was never the bug. The actual cause: nested
    // overflow-y-auto panes below (lines ~188-199) sat in flex items
    // with the default `min-height: auto`, so a left-control toggle
    // that changed content height (e.g. "Show greeting") could grow/
    // shrink the flex item itself instead of scrolling inside it,
    // which reflowed this whole h-screen tree and made it look like
    // the page "jumped." `min-h-0` on that chain fixes it — the actual
    // fix is below, not on this root div.
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      <StudioTopBar
        chatbotName={chatbot.name}
        companyName={company?.name}
        onBack={() => navigate(`/chatbots/${id}`)}
        hasChanges={hasChanges}
        justSaved={justSaved}
        saving={saving}
        onSave={handleSave}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
      />

      {conflict && (
        <div className="animate-fade-in-up flex items-center justify-between gap-3 border-b border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          <span>Someone else updated this chatbot. Refresh to load the latest version, or keep editing — saving will overwrite their change.</span>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={load}
              className="rounded-md border border-warning-300 px-2.5 py-1 text-xs font-medium text-warning-700 transition-colors hover:bg-warning-100 dark:border-warning-500/40 dark:text-warning-300 dark:hover:bg-warning-500/20"
            >
              Refresh
            </button>
            <button
              onClick={() => setConflict(false)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-warning-600 transition-colors hover:bg-warning-100 dark:text-warning-400 dark:hover:bg-warning-500/20"
            >
              Keep my changes
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-1 border-b border-gray-100 bg-white px-4 py-2 dark:bg-[var(--surface)] dark:border-[var(--border)] lg:hidden">
        {["customize", "preview"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition-colors ${
              mobileTab === tab
                ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Configuration panel */}
        <div
          className={`min-h-0 w-full shrink-0 overflow-y-auto border-r border-gray-100 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)] lg:block lg:w-[420px] ${
            mobileTab === "customize" ? "block" : "hidden"
          }`}
        >
          <div className="flex h-full min-h-0">
            <div className="w-40 shrink-0 border-r border-gray-100 p-2 dark:border-[var(--border)]">
              <StudioSectionNav active={activeSection} onChange={setActiveSection} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {activeSection === "launcher" && (
                <SectionLauncher
                  value={draftConfig.launcher}
                  onChange={(field, v) => updateField("launcher", field, v)}
                />
              )}
              {activeSection === "chatWindow" && (
                <SectionChatWindow
                  value={draftConfig.chatWindow}
                  onChange={(field, v) => updateField("chatWindow", field, v)}
                />
              )}
              {activeSection === "welcome" && (
                <SectionWelcome
                  value={draftConfig.chatWindow.welcomeMessage}
                  onChange={(v) => updateField("chatWindow", "welcomeMessage", v)}
                />
              )}
              {activeSection === "behavior" && (
                <SectionBehavior
                  value={draftConfig.behavior}
                  onChange={(field, v) => updateField("behavior", field, v)}
                />
              )}
              {activeSection === "forms" && (
                <SectionForms
                  value={draftConfig.forms}
                  onChange={(field, v) => updateField("forms", field, v)}
                />
              )}
              {activeSection === "language" && (
                <SectionLanguage
                  value={draftConfig.language}
                  onChange={(field, v) => updateField("language", field, v)}
                />
              )}
              {activeSection === "appearance" && (
                <SectionAppearance
                  value={draftConfig.appearance}
                  onChange={(field, v) => updateField("appearance", field, v)}
                />
              )}

              <div className="mt-8 border-t border-gray-100 pt-5 dark:border-[var(--border)]">
                <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                  Reset to defaults
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          className={`min-h-0 flex-1 overflow-hidden bg-gray-50 dark:bg-black/10 lg:block ${
            mobileTab === "preview" ? "block" : "hidden"
          }`}
        >
          <PreviewFrame config={draftConfig} deviceMode={deviceMode} companyId={company?.companyId} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset changes?"
        message="This resets your unsaved editor to the default configuration. Nothing is saved until you click Save changes."
        confirmLabel="Reset"
        variant="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
