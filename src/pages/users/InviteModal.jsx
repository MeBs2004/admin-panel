import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";

const ROLE_OPTIONS = [
  { value: "AGENT", label: "Agent" },
  { value: "VIEWER", label: "Viewer" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "COMPANY_ADMIN", label: "Company Admin" },
];

export default function InviteModal({ open, onClose, onSaved }) {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", role: "AGENT", companyAccess: [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ email: "", name: "", role: "AGENT", companyAccess: [] });
    setError("");
    setResult(null);
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => setCompanies(res.data.companies))
      .catch(() => setCompanies([]));
  }, [open]);

  const toggleCompany = (companyId) => {
    setForm((f) => ({
      ...f,
      companyAccess: f.companyAccess.includes(companyId)
        ? f.companyAccess.filter((c) => c !== companyId)
        : [...f.companyAccess, companyId],
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.companyAccess.length === 0) return setError("Select at least one company.");

    setSaving(true);
    try {
      const res = await api.post("/invitations", form);
      setResult(res.data);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inviteLink = result ? `${window.location.origin}/accept-invite/${result.rawToken}` : "";
  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    showToast("Invite link copied.");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Team Member"
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
              Create Invitation
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
            {result.message}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Share this link with {form.email} — it works once and expires in 7 days.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/10 dark:text-gray-100">
              {inviteLink}
            </code>
            <Button variant="secondary" onClick={copyLink}>
              <FiCopy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Name (optional)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Access
            </span>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {companies.length === 0 && <p className="text-sm text-gray-400">No companies available.</p>}
              {companies.map((c) => (
                <label
                  key={c.companyId}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={form.companyAccess.includes(c.companyId)}
                    onChange={() => toggleCompany(c.companyId)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Email delivery isn't configured on this platform — you'll get a link to share directly after creating
            this invitation.
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
