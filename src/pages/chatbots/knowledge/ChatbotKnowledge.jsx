import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUpload, FiSend, FiCheck, FiRefreshCw } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { subscribeCompany } from "../../../services/realtime.js";
import { useToast } from "../../../context/ToastContext.jsx";
import PageHeader from "../../../components/ui/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";

export default function ChatbotKnowledge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [testing, setTesting] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [testError, setTestError] = useState("");
  const [updatedElsewhere, setUpdatedElsewhere] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const justSavedRef = useRef(false);

  const load = () => {
    setLoading(true);
    setError("");
    setUpdatedElsewhere(false);
    api
      .get(`/chatbots/${id}/knowledge`)
      .then((res) => {
        setData(res.data);
        setContent(res.data.content);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // Knowledge is shared at the Company level (Company.knowledgeFile)
  // — another admin's save (from this chatbot or a sibling one)
  // invalidates what's on screen. Never auto-reload over unsaved
  // edits (Section 31) — surface a banner; the existing 409 handling
  // already covers the "tried to save over it" case.
  useEffect(() => {
    if (!data?.companyId) return undefined;
    return subscribeCompany(data.companyId, (evt) => {
      if (evt.type === "knowledge.updated" && !justSavedRef.current) setUpdatedElsewhere(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.companyId]);

  const handleSave = async () => {
    setSaving(true);
    justSavedRef.current = true;
    setTimeout(() => (justSavedRef.current = false), 3000);
    try {
      const res = await api.put(`/chatbots/${id}/knowledge`, { content, expectedUpdatedAt: data.updatedAt });
      showToast("Knowledge base updated — live for the next visitor message.");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
      setUpdatedElsewhere(false);
      setData((d) => ({ ...d, updatedAt: res.data.updatedAt, characterCount: content.length, status: content.trim() ? "READY" : "EMPTY", error: null }));
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
  // (Atlas UI, a script) rather than through this page — that case
  // self-heals within 30s on its own, but this forces it immediately.
  // A normal Save above is already instant; this button doesn't make
  // Save any faster, it's for the out-of-band case.
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await api.post(`/chatbots/${id}/knowledge/clear-cache`);
      showToast("Knowledge cache cleared — the next message will reload from MongoDB.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setClearingCache(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/chatbots/${id}/knowledge/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent((c) => (c.trim() ? `${c}\n\n--- From ${res.data.filename} ---\n${res.data.extractedText}` : res.data.extractedText));
      showToast(`Extracted text from ${res.data.filename} — review it below, then Save to persist.`);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTest = async () => {
    if (!question.trim()) return;
    setTesting(true);
    setTestError("");
    setAnswer(null);
    try {
      const res = await api.post(`/chatbots/${id}/knowledge/test`, { question });
      setAnswer(res.data);
    } catch (err) {
      setTestError(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const hasChanges = content !== data.content;

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        breadcrumbs={[
          { label: "Chatbots", to: "/chatbots" },
          { label: "Chatbot", to: `/chatbots/${id}` },
          { label: "Knowledge Base" },
        ]}
        action={
          <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}`)}>
            Back to Chatbot
          </Button>
        }
      />

      {updatedElsewhere && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-info-50 px-4 py-3 text-sm text-info-700 dark:bg-info-500/10 dark:text-info-300">
          <span>The knowledge base was updated elsewhere. Your unsaved edits here are kept — reload to see the latest before saving, or save to attempt a merge (a conflict will show if it's genuinely incompatible).</span>
          <Button variant="secondary" onClick={load}>
            Reload
          </Button>
        </div>
      )}

      {data.siblingChatbotCount > 0 && (
        <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
          This company has {data.siblingChatbotCount + 1} chatbots. The knowledge base is shared across all of
          them — saving here changes what every chatbot in this company knows, not just this one.
        </p>
      )}

      <div className="space-y-6">
        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{data.knowledgeFile}</p>
              <p className="mt-1 text-xs text-gray-400">
                {(data.sizeBytes / 1024).toFixed(1)} KB
                {data.updatedAt && ` · Updated ${new Date(data.updatedAt).toLocaleString()}`}
              </p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          {data.error && (
            <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
              {data.error}
            </p>
          )}
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Knowledge Content</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleClearCache}
                loading={clearingCache}
                title="Force an immediate reload from MongoDB — only needed if knowledge was edited outside this page (e.g. directly in the database); a normal Save here is already instant."
              >
                <FiRefreshCw className="h-3.5 w-3.5" /> Clear Cache
              </Button>
              <input ref={fileInputRef} type="file" hidden accept=".txt,.pdf,.docx,.xlsx" onChange={handleUpload} />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                <FiUpload className="h-3.5 w-3.5" /> Upload (.txt, .pdf, .docx, .xlsx)
              </Button>
            </div>
          </div>

          <textarea
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
          />

          <div className="mt-3 flex items-center gap-3">
            <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
              {hasChanges ? "Save Changes" : "Saved"}
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
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Test Knowledge</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Runs a real question through the AI using this knowledge base. Answers are generated from the text above —
            there is no per-passage source citation to show.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              placeholder="What services does this company provide?"
              className="flex-1"
            />
            <Button onClick={handleTest} loading={testing} disabled={!question.trim()}>
              <FiSend className="h-3.5 w-3.5" /> Ask
            </Button>
          </div>
          {testError && <p className="mt-3 text-sm text-danger-600">{testError}</p>}
          {answer && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-200">
              {answer.answer}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
