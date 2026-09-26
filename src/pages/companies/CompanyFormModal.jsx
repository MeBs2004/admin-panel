import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";

const EMPTY = {
  companyId: "",
  name: "",
  domain: "",
  website: "",
  knowledgeFile: "",
};

export default function CompanyFormModal({ open, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError("");
    }
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    if (!form.companyId.trim() || !form.name.trim() || !form.domain.trim() || !form.knowledgeFile.trim()) {
      setError("companyId, name, domain and knowledgeFile are required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/companies", form);
      showToast("Company created successfully.");
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Company"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create Company
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Company ID"
          placeholder="e.g. acme-corp"
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
        />
        <Input
          label="Company Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Domain"
          placeholder="https://example.com"
          value={form.domain}
          onChange={(e) => setForm({ ...form, domain: e.target.value })}
        />
        <Input
          label="Knowledge File"
          placeholder="knowledge.txt"
          value={form.knowledgeFile}
          onChange={(e) => setForm({ ...form, knowledgeFile: e.target.value })}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
