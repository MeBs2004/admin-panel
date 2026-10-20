import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";

// Permanent delete — the admin must type the company's exact name
// (the backend re-checks it) before the button enables.
export default function DeleteCompanyModal({ company, onClose, onDeleted }) {
  const { showToast } = useToast();
  const [confirmName, setConfirmName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConfirmName("");
  }, [company]);

  if (!company) return null;
  const matches = confirmName.trim() === company.name.trim();

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/companies/${company.companyId}`, { data: { confirmName } });
      showToast(`"${company.name}" was deleted.`);
      onDeleted?.(company);
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Delete company"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={!matches} loading={busy}>
            Delete permanently
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-500/10 dark:text-red-300">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This permanently deletes <strong>{company.name}</strong> and all of its chatbots, flows, visitors,
            conversations, API keys, webhooks, billing records and team access. This cannot be undone.
          </p>
        </div>
        <Input
          label={`Type "${company.name}" to confirm`}
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={company.name}
          autoFocus
        />
      </div>
    </Modal>
  );
}
