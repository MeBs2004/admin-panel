import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function AssignAccessModal({ open, chatbotId, onClose, onSaved }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setUserId("");
    api
      .get("/users", { params: { limit: 100 } })
      .then((res) => {
        setUsers(res.data.users);
        if (res.data.users.length) setUserId(res.data.users[0]._id);
      })
      .catch(() => setUsers([]));
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    if (!userId) return setError("Select a user.");

    setSaving(true);
    try {
      await api.post(`/chatbots/${chatbotId}/access`, { userId });
      showToast("User assigned to chatbot.");
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
      title="Assign User"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No eligible users found. Add company access to a user first.
          </p>
        ) : (
          <Select
            label="User"
            options={users.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
