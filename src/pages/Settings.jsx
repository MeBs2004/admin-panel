import { useState } from "react";
import { FiUser, FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";

function SectionCard({ icon: Icon, title, description, children, index = 0 }) {
  return (
    <div
      className="stagger-in max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]"
      style={{ "--stagger-index": index }}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (password && password.length < 8)
      return setError("Password must be at least 8 characters.");

    setSaving(true);
    try {
      const res = await api.patch(`/users/${user._id}`, {
        name,
        phone,
        ...(password ? { password } : {}),
      });
      setUser(res.data.user);
      localStorage.setItem("nuformly-user", JSON.stringify(res.data.user));
      setPassword("");
      showToast("Profile updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your Nuformly profile." />

      <div className="space-y-4">
        <SectionCard icon={FiUser} title="My Profile" description="Your account identity" index={0}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {user?.email}
              </p>
              <StatusBadge status={user?.role?.replaceAll("_", " ")} />
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input
              label="New Password (optional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />

            {error && (
              <p className="animate-fade-in-up rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </SectionCard>

        <SectionCard icon={FiShield} title="Access" description="What this account can do" index={1}>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Role</dt>
              <dd className="font-medium text-gray-800 dark:text-gray-100">
                {user?.role?.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Status</dt>
              <dd><StatusBadge status={user?.status} /></dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
