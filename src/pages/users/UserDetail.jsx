import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiPlus, FiX } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const COMPANY_ROLE_OPTIONS = [
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "AGENT", label: "Agent" },
  { value: "VIEWER", label: "Viewer" },
  { value: "DEVELOPER", label: "Developer" },
];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const [allCompanies, setAllCompanies] = useState([]);
  const [grantCompanyId, setGrantCompanyId] = useState("");
  const [grantCompanyRole, setGrantCompanyRole] = useState("AGENT");

  const [companyForBots, setCompanyForBots] = useState("");
  const [botsForCompany, setBotsForCompany] = useState([]);
  const [grantChatbotId, setGrantChatbotId] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/users/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => setAllCompanies(res.data.companies))
      .catch(() => setAllCompanies([]));
  }, []);

  useEffect(() => {
    if (!companyForBots) {
      setBotsForCompany([]);
      return;
    }
    api
      .get("/chatbots", { params: { companyId: companyForBots, limit: 100 } })
      .then((res) => setBotsForCompany(res.data.chatbots))
      .catch(() => setBotsForCompany([]));
  }, [companyForBots]);

  const setStatus = async (status) => {
    setBusy(true);
    try {
      await api.post(`/users/${id}/status`, { status });
      showToast(`User ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      setTempPassword(res.data.temporaryPassword);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const deleteUser = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${id}`);
      showToast("User deleted.");
      navigate("/users");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setBusy(false);
      setConfirm(null);
    }
  };

  const grantCompanyAccess = async () => {
    if (!grantCompanyId) return;
    setBusy(true);
    try {
      await api.post(`/users/${id}/company-access`, { companyId: grantCompanyId, role: grantCompanyRole });
      showToast("Company access granted.");
      setGrantCompanyId("");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const revokeCompanyAccess = async (companyId) => {
    setBusy(true);
    try {
      await api.delete(`/users/${id}/company-access/${companyId}`);
      showToast("Company access revoked.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const grantChatbotAccess = async () => {
    if (!grantChatbotId) return;
    setBusy(true);
    try {
      await api.post(`/users/${id}/chatbot-access`, { chatbotId: grantChatbotId });
      showToast("Chatbot access granted.");
      setGrantChatbotId("");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const revokeChatbotAccess = async (chatbotId) => {
    setBusy(true);
    try {
      await api.delete(`/users/${id}/chatbot-access/${chatbotId}`);
      showToast("Chatbot access revoked.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { user, companyAccess, chatbotAccess, grantableCompanyIds } = data;
  const isSelf = me?._id === user._id;
  // Mirrors the backend's own boundary (user.controller.js
  // canManageUserAsCompanyAdmin): a Super Admin can manage anyone;
  // otherwise users.manage plus "not a Super Admin target" plus "not
  // myself" — the backend independently re-verifies company overlap
  // regardless of what this shows.
  const canManageThisUser =
    !isSelf && (me?.role === "SUPER_ADMIN" || (can(me?.role, PERMISSIONS.USERS_MANAGE) && user.role !== "SUPER_ADMIN"));
  const canManageAccess = canManageThisUser;

  // Companies this ACTOR may grant — null means unrestricted (Super Admin).
  const grantableCompanies =
    grantableCompanyIds === null
      ? allCompanies
      : allCompanies.filter((c) => grantableCompanyIds.includes(c.companyId));
  const companiesNotYetGranted = grantableCompanies.filter(
    (c) => !companyAccess.some((a) => a.companyId === c.companyId)
  );

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        breadcrumbs={[{ label: "Team", to: "/users" }, { label: user.name }]}
        action={
          <Button variant="secondary" onClick={() => navigate("/users")}>
            Back to Team
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Profile
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {user.role.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <StatusBadge status={user.status} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {user.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Last Login</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Company Access
            </h3>
            {user.role === "SUPER_ADMIN" ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">All companies (Super Admin)</p>
            ) : (
              <div className="space-y-2">
                {companyAccess.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No company access assigned.</p>
                )}
                {companyAccess.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-white/5"
                  >
                    <span className="text-gray-700 dark:text-gray-200">
                      {a.companyId} — {a.role.replaceAll("_", " ")}
                    </span>
                    {canManageAccess && (
                      <button
                        onClick={() =>
                          setConfirm({
                            title: "Revoke Company Access?",
                            message: `${user.name} will lose access to ${a.companyId}.`,
                            action: () => revokeCompanyAccess(a.companyId),
                          })
                        }
                        className="text-gray-400 hover:text-danger-500"
                        aria-label="Revoke"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {canManageAccess && companiesNotYetGranted.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3 dark:border-white/5">
                    <div className="w-40">
                      <Select
                        label="Company"
                        options={[{ value: "", label: "Select..." }, ...companiesNotYetGranted.map((c) => ({ value: c.companyId, label: c.name }))]}
                        value={grantCompanyId}
                        onChange={(e) => setGrantCompanyId(e.target.value)}
                      />
                    </div>
                    <div className="w-40">
                      <Select
                        label="Role"
                        options={COMPANY_ROLE_OPTIONS}
                        value={grantCompanyRole}
                        onChange={(e) => setGrantCompanyRole(e.target.value)}
                      />
                    </div>
                    <Button onClick={grantCompanyAccess} loading={busy} disabled={!grantCompanyId}>
                      <FiPlus /> Grant
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Chatbot Access
            </h3>
            {user.role === "SUPER_ADMIN" ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">All chatbots (Super Admin)</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  A user with Company Access already reaches every chatbot in that company — this section is for
                  granting access to one specific chatbot without full company access.
                </p>
                {chatbotAccess.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No individual chatbot access assigned.</p>
                )}
                {chatbotAccess.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-white/5"
                  >
                    <span className="text-gray-700 dark:text-gray-200">
                      {a.chatbot?.name || a.chatbotId} {a.chatbot?.companyId ? `(${a.chatbot.companyId})` : ""}
                    </span>
                    {canManageAccess && (
                      <button
                        onClick={() =>
                          setConfirm({
                            title: "Revoke Chatbot Access?",
                            message: `${user.name} will lose access to ${a.chatbot?.name || "this chatbot"}.`,
                            action: () => revokeChatbotAccess(a.chatbotId),
                          })
                        }
                        className="text-gray-400 hover:text-danger-500"
                        aria-label="Revoke"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {canManageAccess && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3 dark:border-white/5">
                    <div className="w-40">
                      <Select
                        label="Company"
                        options={[{ value: "", label: "Select..." }, ...grantableCompanies.map((c) => ({ value: c.companyId, label: c.name }))]}
                        value={companyForBots}
                        onChange={(e) => {
                          setCompanyForBots(e.target.value);
                          setGrantChatbotId("");
                        }}
                      />
                    </div>
                    <div className="w-48">
                      <Select
                        label="Chatbot"
                        options={[{ value: "", label: "Select..." }, ...botsForCompany.map((b) => ({ value: b._id, label: b.name }))]}
                        value={grantChatbotId}
                        onChange={(e) => setGrantChatbotId(e.target.value)}
                        disabled={!companyForBots}
                      />
                    </div>
                    <Button onClick={grantChatbotAccess} loading={busy} disabled={!grantChatbotId}>
                      <FiPlus /> Grant
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {canManageThisUser && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Actions
            </h2>
            <div className="flex flex-col gap-2">
              {user.status !== "ACTIVE" && (
                <Button variant="secondary" onClick={() => setStatus("ACTIVE")} loading={busy}>
                  Activate
                </Button>
              )}
              {user.status === "ACTIVE" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setConfirm({
                      title: "Deactivate User?",
                      message: `${user.name} will no longer be able to access Nuformly. Any conversations assigned to them will be unassigned.`,
                      action: () => setStatus("INACTIVE"),
                    })
                  }
                >
                  Deactivate
                </Button>
              )}
              {user.status !== "SUSPENDED" && (
                <Button
                  variant="danger"
                  onClick={() =>
                    setConfirm({
                      title: "Suspend User?",
                      message: `${user.name} will be suspended immediately. Any conversations assigned to them will be unassigned.`,
                      action: () => setStatus("SUSPENDED"),
                    })
                  }
                >
                  Suspend
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() =>
                  setConfirm({
                    title: "Reset Password?",
                    message: `A new temporary password will be generated for ${user.name}.`,
                    confirmLabel: "Reset Password",
                    action: resetPassword,
                  })
                }
              >
                Reset Password
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  setConfirm({
                    title: "Delete User?",
                    message: `${user.name} will be permanently removed from Nuformly. Any conversations assigned to them will be unassigned. This cannot be undone.`,
                    confirmLabel: "Delete",
                    action: deleteUser,
                  })
                }
              >
                Delete User
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
      />

      <Modal
        open={!!tempPassword}
        onClose={() => setTempPassword(null)}
        title="Temporary Password"
        footer={<Button onClick={() => setTempPassword(null)}>Done</Button>}
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Share this securely with {user.name} — it will not be shown again.
        </p>
        <code className="block rounded-lg bg-gray-100 px-3 py-2 text-sm font-mono dark:bg-white/10 dark:text-gray-100">
          {tempPassword}
        </code>
      </Modal>
    </div>
  );
}
