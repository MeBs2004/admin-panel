import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function WebhookFormModal({ open, onClose, companyId, webhook, availableEvents, onSaved }) {
  const { showToast } = useToast();
  const [chatbots, setChatbots] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState([]);
  const [chatbotIds, setChatbotIds] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState(null);

  const isEdit = !!webhook;

  useEffect(() => {
    if (!open) return;
    setName(webhook?.name || "");
    setUrl(webhook?.url || "");
    setEvents(webhook?.events || []);
    setChatbotIds(webhook?.chatbotIds?.map(String) || []);
    setError("");
    setSecret(null);
    api.get("/chatbots", { params: { companyId, limit: 100 } }).then((res) => setChatbots(res.data.chatbots || []));
  }, [open, webhook, companyId]);

  const toggleEvent = (event) => setEvents((e) => (e.includes(event) ? e.filter((x) => x !== event) : [...e, event]));
  const toggleChatbot = (id) => setChatbotIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (!url.trim()) return setError("URL is required.");
    if (events.length === 0) return setError("Select at least one event.");

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/developer/webhooks/${webhook._id}`, { name, url, events, chatbotIds });
        showToast("Webhook updated.");
        onSaved();
        onClose();
      } else {
        const res = await api.post("/developer/webhooks", { companyId, name, url, events, chatbotIds });
        setSecret(res.data.secret);
        onSaved();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard?.writeText(secret);
    showToast("Signing secret copied.");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Webhook" : "Create Webhook"}
      wide
      footer={
        secret ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {isEdit ? "Save Changes" : "Create Webhook"}
            </Button>
          </>
        )
      }
    >
      {secret ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
            Signing secret — this will not be shown again. Use it to verify the{" "}
            <code>X-Nuformly-Signature</code> header on incoming events.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/10 dark:text-gray-100">
              {secret}
            </code>
            <Button variant="secondary" onClick={copySecret}>
              <FiCopy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CRM sync" />
          <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/nuformly" />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Events</span>
            <div className="space-y-1 rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {availableEvents.map((event) => (
                <label key={event} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                  <input type="checkbox" checked={events.includes(event)} onChange={() => toggleEvent(event)} />
                  <span className="font-mono text-xs">{event}</span>
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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
