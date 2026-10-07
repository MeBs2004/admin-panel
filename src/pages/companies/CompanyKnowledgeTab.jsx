import { useEffect, useRef, useState } from "react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeCompany } from "../../services/realtime.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

/**
 * The real, existing knowledge system: Company.knowledgeContent in
 * MongoDB (previously a local .txt file — moved off disk because
 * Render's web service filesystem is ephemeral and was silently
 * losing edits on every restart/redeploy; see knowledge.service.js).
 * Saving here writes straight to Mongo and invalidates the server's
 * in-memory cache — no separate "processing" pipeline exists, so we
 * don't fake one. Same underlying content as the chatbot-scoped
 * Knowledge Base page (ChatbotKnowledge.jsx) — this is the Company
 * page's door onto it, so both need the same conflict/realtime
 * handling.
 */
export default function CompanyKnowledgeTab({ companyId }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [updatedElsewhere, setUpdatedElsewhere] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const savedTimeout = useRef(null);
  const justSavedRef = useRef(false);

  const load = () => {
    setLoading(true);
    setError("");
    setUpdatedElsewhere(false);
    api
      .get(`/companies/${companyId}/knowledge`)
      .then((res) => {
        setData(res.data);
        setContent(res.data.content);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);
  useEffect(() => () => clearTimeout(savedTimeout.current), []);

  useEffect(() => {
    return subscribeCompany(companyId, (evt) => {
      if (evt.type === "knowledge.updated" && !justSavedRef.current) setUpdatedElsewhere(true);
    });
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    setJustSaved(false);
    justSavedRef.current = true;
    setTimeout(() => (justSavedRef.current = false), 3000);
    try {
      await api.put(`/companies/${companyId}/knowledge`, { content, expectedUpdatedAt: data.updatedAt });
      showToast("Knowledge base updated — now live.");
      setJustSaved(true);
      setUpdatedElsewhere(false);
      savedTimeout.current = setTimeout(() => setJustSaved(false), 2200);
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        showToast("This knowledge base changed elsewhere since you loaded it. Reload to see the latest before saving.", "error");
      } else {
        showToast(getErrorMessage(err), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Manual escape hatch for knowledge edited directly in MongoDB
  // rather than through this page — self-heals within 30s on its own,
  // this forces it immediately. Save above is already instant.
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await api.post(`/companies/${companyId}/knowledge/clear-cache`);
      showToast("Knowledge cache cleared — the next message will reload from MongoDB.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setClearingCache(false);
    }
  };

  if (loading) return <SkeletonLine className="h-64 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-200">{data.knowledgeFile}</span>
        <div className="flex items-center gap-3">
          <span>
            {(data.sizeBytes / 1024).toFixed(1)} KB
            {data.updatedAt && ` · Updated ${new Date(data.updatedAt).toLocaleString()}`}
          </span>
          <Button
            variant="secondary"
            onClick={handleClearCache}
            loading={clearingCache}
            title="Force an immediate reload from MongoDB — only needed if knowledge was edited outside this page (e.g. directly in the database); a normal Save here is already instant."
          >
            <FiRefreshCw className="h-3.5 w-3.5" /> Clear Cache
          </Button>
        </div>
      </div>

      {updatedElsewhere && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-info-50 px-4 py-3 text-sm text-info-700 dark:bg-info-500/10 dark:text-info-300">
          <span>The knowledge base was updated elsewhere. Your unsaved edits here are kept — reload to see the latest before saving.</span>
          <Button variant="secondary" onClick={load}>
            Reload
          </Button>
        </div>
      )}

      {data.error && (
        <p className="mb-3 animate-fade-in rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
          {data.error}
        </p>
      )}

      <textarea
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
      />

      <div className="mt-3 flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          {saving ? "Saving..." : "Save Knowledge Base"}
        </Button>
        {justSaved && (
          <span className="flex animate-fade-in-up items-center gap-1 text-sm font-medium text-success-600 dark:text-success-500">
            <FiCheck className="h-4 w-4" /> Saved
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
