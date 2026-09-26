import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";

const SCOPE_DESCRIPTIONS = {
  "company:read": "Read basic company info",
  "chatbots:read": "List and read chatbots",
  "conversations:read": "Read conversations and messages",
  "conversations:write": "Send a reply into a conversation",
  "visitors:read": "Read visitor records",
  "analytics:read": "Read analytics metrics",
  "knowledge:read": "Read the knowledge base",
  "webhooks:read": "List developer webhooks",
  "webhooks:write": "Create, update, and delete developer webhooks",
};

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "custom", label: "Custom date" },
];

export default function CreateApiKeyModal({ open, onClose, companyId, onSaved }) {
  const { showToast } = useToast();
  const [availableScopes, setAvailableScopes] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState([]);
  const [chatbotIds, setChatbotIds] = useState([]);
  const [expiresIn, setExpiresIn] = useState("never");
  const [customDate, setCustomDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setScopes([]);
    setChatbotIds([]);
    setExpiresIn("never");
    setCustomDate("");
    setError("");
    setResult(null);
    api.get("/developer/api-keys", { params: { companyId } }).then((res) => setAvailableScopes(res.data.availableScopes || []));
    api.get("/chatbots", { params: { companyId, limit: 100 } }).then((res) => setChatbots(res.data.chatbots || []));
  }, [open, companyId]);

  const toggleScope = (scope) => {
    setScopes((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]));
  };
  const toggleChatbot = (id) => {
    setChatbotIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (scopes.length === 0) return setError("Select at least one scope.");
    if (expiresIn === "custom" && !customDate) return setError("Select an expiration date.");

    setSaving(true);
    try {
      const res = await api.post("/developer/api-keys", {
        companyId,
        name,
        scopes,
        chatbotIds,
        expiresIn,
        expiresAt: expiresIn === "custom" ? customDate : undefined,
      });
      setResult(res.data);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard?.writeText(result.token);
    showToast("API key copied.");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create API Key"
      wide
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Create API Key
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
            Your API key has been created. This secret will not be shown again — copy it now.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/10 dark:text-gray-100">
              {result.token}
            </code>
            <Button variant="secondary" onClick={copyToken}>
              <FiCopy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CRM Integration" />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Scopes</span>
            <div className="space-y-1 rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {availableScopes.map((scope) => (
                <label key={scope} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                  <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                  <span className="font-mono text-xs">{scope}</span>
                  <span className="text-gray-400">— {SCOPE_DESCRIPTIONS[scope]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chatbot Scope (optional — leave empty for the whole company)
            </span>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {chatbots.length === 0 && <p className="text-sm text-gray-400">No chatbots yet.</p>}
              {chatbots.map((c) => (
                <label key={c._id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                  <input type="checkbox" checked={chatbotIds.includes(c._id)} onChange={() => toggleChatbot(c._id)} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Expiration" options={EXPIRY_OPTIONS} value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} />
            {expiresIn === "custom" && (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Expiration date</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
