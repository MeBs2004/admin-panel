import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function TaskFormModal({ open, onClose, onSaved, companies, task, defaultCompanyId, defaultAssigneeId }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setCompanyId(task?.companyId || defaultCompanyId || companies[0]?.companyId || "");
    setPriority(task?.priority || "MEDIUM");
    setAssigneeId(task?.assigneeId?._id || task?.assigneeId || defaultAssigneeId || "");
    setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
    setError("");
  }, [open, task, defaultCompanyId, defaultAssigneeId, companies]);

  useEffect(() => {
    if (!companyId) {
      setUsers([]);
      return;
    }
    api
      .get("/users", { params: { companyId, limit: 100 } })
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setUsers([]));
  }, [companyId]);

  const save = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!companyId) {
      setError("Company is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        description,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      };
      if (task) {
        await api.patch(`/tasks/${task._id}`, payload);
        showToast("Task updated.");
      } else {
        await api.post("/tasks", { ...payload, companyId });
        showToast("Task created.");
      }
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
      title={task ? "Edit Task" : "New Task"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Company"
            disabled={!!task}
            options={companies.map((c) => ({ value: c.companyId, label: c.name }))}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
          <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assignee"
            options={[{ value: "", label: "Unassigned" }, ...users.map((u) => ({ value: u._id, label: u.name }))]}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
