import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const BASE_ROLE_OPTIONS = [
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "AGENT", label: "Agent" },
  { value: "VIEWER", label: "Viewer" },
  { value: "DEVELOPER", label: "Developer" },
];

export default function UserFormModal({ open, onClose, onSaved }) {
  const { showToast } = useToast();
  const { user: me } = useAuth();
  // A Company Admin can never grant Super Admin (the backend rejects
  // it regardless — this just avoids offering a choice that would
  // fail).
  const ROLE_OPTIONS =
    me?.role === "SUPER_ADMIN"
      ? [...BASE_ROLE_OPTIONS, { value: "SUPER_ADMIN", label: "Super Admin" }]
      : BASE_ROLE_OPTIONS;
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "VIEWER",
    companyAccess: [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "VIEWER",
      companyAccess: [],
    });
    setError("");
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

    if (!form.name.trim()) return setError("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Please enter a valid email address.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");

    setSaving(true);
    try {
      await api.post("/users", form);
      showToast("User created successfully.");
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add User" wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create User
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </div>

        {form.role !== "SUPER_ADMIN" && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Access
            </span>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {companies.length === 0 && (
                <p className="text-sm text-gray-400">No companies yet.</p>
              )}
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
