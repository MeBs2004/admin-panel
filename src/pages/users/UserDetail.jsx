import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiPlus, FiX, FiCheck } from "react-icons/fi";
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
import EmptyState from "../../components/ui/EmptyState.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import TaskFormModal from "../tasks/TaskFormModal.jsx";

const SYSTEM_COMPANY_ROLE_OPTIONS = [
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
  const [customRolesForGrant, setCustomRolesForGrant] = useState([]);

  const [companyForBots, setCompanyForBots] = useState("");
  const [botsForCompany, setBotsForCompany] = useState([]);
  const [grantChatbotId, setGrantChatbotId] = useState("");

  const [tab, setTab] = useState("access");

  const [permCompanyId, setPermCompanyId] = useState("");
  const [permData, setPermData] = useState(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permOverrides, setPermOverrides] = useState({});
  const [permSaving, setPermSaving] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

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

  useEffect(() => {
    if (!grantCompanyId) {
      setCustomRolesForGrant([]);
      return;
    }
    api
      .get("/roles", { params: { companyId: grantCompanyId } })
      .then((res) => setCustomRolesForGrant(res.data.roles || []))
      .catch(() => setCustomRolesForGrant([]));
  }, [grantCompanyId]);

  const [roleLabelById, setRoleLabelById] = useState({});
  useEffect(() => {
    if (!data?.companyAccess?.length) return;
    const systemKeys = new Set(["COMPANY_ADMIN", "AGENT", "VIEWER", "DEVELOPER"]);
    const companyIds = [...new Set(data.companyAccess.filter((a) => !systemKeys.has(a.role)).map((a) => a.companyId))];
    if (companyIds.length === 0) return;
    Promise.all(companyIds.map((cid) => api.get("/roles", { params: { companyId: cid } }).catch(() => ({ data: { roles: [] } }))))
      .then((responses) => {
        const map = {};
        responses.forEach((res) => (res.data.roles || []).forEach((r) => (map[r._id] = r.name)));
        setRoleLabelById(map);
      });
  }, [data]);

  const formatRoleLabel = (role) =>
    ["COMPANY_ADMIN", "AGENT", "VIEWER", "DEVELOPER"].includes(role) ? role.replaceAll("_", " ") : roleLabelById[role] || "Custom Role";

  const loadPermissions = (cid) => {
    if (!cid) return;
    setPermLoading(true);
    api
      .get(`/users/${id}/effective-permissions`, { params: { companyId: cid } })
      .then((res) => {
        setPermData(res.data);
        setPermOverrides(Object.fromEntries((res.data.overrides || []).map((o) => [o.permission, o.granted])));
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setPermLoading(false));
  };

  useEffect(() => {
    if (tab !== "permissions") return;
    if (!permCompanyId && data?.companyAccess?.length) {
      setPermCompanyId(data.companyAccess[0].companyId);
      return;
    }
    loadPermissions(permCompanyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, permCompanyId, data]);

  const loadTasks = () => {
    setTasksLoading(true);
    api
      .get("/tasks", { params: { assignee: id, limit: 100 } })
      .then((res) => setTasks(res.data.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  };

  useEffect(() => {
    if (tab === "tasks") loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const savePermissionOverrides = async () => {
    setPermSaving(true);
    try {
      const overrides = Object.entries(permOverrides).map(([permission, granted]) => ({ permission, granted }));
      await api.patch(`/users/${id}/permission-overrides`, { companyId: permCompanyId, overrides });
      showToast("Permission overrides saved.");
      loadPermissions(permCompanyId);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPermSaving(false);
    }
  };

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

          <Tabs
            tabs={[
              { value: "access", label: "Access" },
              { value: "permissions", label: "Permissions" },
              { value: "tasks", label: "Tasks" },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "access" && (
          <>
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
                      {a.companyId} — {formatRoleLabel(a.role)}
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
                        options={[...SYSTEM_COMPANY_ROLE_OPTIONS, ...customRolesForGrant.map((r) => ({ value: r._id, label: r.name }))]}
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
          </>
          )}

          {tab === "permissions" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              {user.role === "SUPER_ADMIN" ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Super Admin has every permission on every company.</p>
              ) : companyAccess.length === 0 ? (
                <EmptyState title="No company access yet" description="Grant company access first to manage permissions." />
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="w-56">
                      <Select
                        label="Company"
                        options={companyAccess.map((a) => ({ value: a.companyId, label: a.companyId }))}
                        value={permCompanyId}
                        onChange={(e) => setPermCompanyId(e.target.value)}
                      />
                    </div>
                    {permData && (
                      <p className="text-xs text-gray-400">
                        Role: <span className="font-medium text-gray-600 dark:text-gray-300">{permData.roleLabel}</span>
                      </p>
                    )}
                  </div>

                  {permLoading && <SkeletonLine className="h-24 w-full" />}

                  {!permLoading && permData && (
                    <>
                      {(() => {
                        const canEditOverrides =
                          canManageAccess && (me?.role === "SUPER_ADMIN" || can(me?.role, PERMISSIONS.USERS_MANAGE_PERMISSIONS));
                        return (
                          <>
                            <p className="mb-3 text-xs text-gray-400">
                              Checked = granted (inherited from role, or an override). Unchecking something the role grants adds
                              an explicit denial override; checking something the role doesn't grant adds an explicit grant
                              override — you can never grant a permission you don't have yourself.
                            </p>
                            <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
                              {Object.values(PERMISSIONS).map((perm) => {
                                const inherited = permData.basePermissions.includes(perm);
                                const effective = permOverrides[perm] !== undefined ? permOverrides[perm] : inherited;
                                const isOverridden = permOverrides[perm] !== undefined && permOverrides[perm] !== inherited;
                                return (
                                  <label
                                    key={perm}
                                    className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                                  >
                                    <span className={`flex items-center gap-2 ${effective ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}`}>
                                      <input
                                        type="checkbox"
                                        checked={effective}
                                        disabled={!canEditOverrides}
                                        onChange={(e) => setPermOverrides((prev) => ({ ...prev, [perm]: e.target.checked }))}
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                                      />
                                      {perm}
                                    </span>
                                    {isOverridden && (
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-primary-500">override</span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                            {canEditOverrides && (
                              <div className="mt-4 flex justify-end">
                                <Button onClick={savePermissionOverrides} loading={permSaving}>
                                  <FiCheck /> Save Overrides
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Assigned Tasks</h3>
                {canManageAccess && (
                  <Button onClick={() => setShowTaskForm(true)}>
                    <FiPlus /> Assign Task
                  </Button>
                )}
              </div>
              {tasksLoading && <SkeletonLine className="h-20 w-full" />}
              {!tasksLoading && tasks.length === 0 && <EmptyState title="No tasks assigned to this user." />}
              {!tasksLoading && tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t._id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-white/5">
                      <div>
                        <p className={`font-medium ${t.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-200"}`}>
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t.companyId} {t.dueDate ? `· Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

      <TaskFormModal
        open={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSaved={loadTasks}
        companies={allCompanies.filter((c) => companyAccess.some((a) => a.companyId === c.companyId))}
        defaultCompanyId={companyAccess[0]?.companyId}
        defaultAssigneeId={id}
      />

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
