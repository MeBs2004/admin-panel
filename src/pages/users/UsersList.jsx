import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSend } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import UserFormModal from "./UserFormModal.jsx";
import InviteModal from "./InviteModal.jsx";
import InvitationsPanel from "./InvitationsPanel.jsx";

export default function UsersList() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("members");
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const canManage = can(me?.role, PERMISSIONS.USERS_MANAGE);

  const load = (page = 1) => {
    setLoading(true);
    setError("");
    api
      .get("/users", { params: { page, search: search || undefined } })
      .then((res) => {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab !== "members") return;
    const timeout = setTimeout(() => load(1), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab]);

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage teammates, roles, and access."
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowInvite(true)}>
                <FiSend /> Invite Member
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <FiPlus /> Add User
              </Button>
            </div>
          )
        }
      />

      {canManage && (
        <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-[var(--border)]">
          {[
            { key: "members", label: "Members" },
            { key: "invitations", label: "Pending Invitations" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "invitations" && canManage ? (
        <InvitationsPanel />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
            {loading && <SkeletonTable />}

            {!loading && error && <ErrorState message={error} onRetry={() => load(1)} />}

            {!loading && !error && users.length === 0 && (
              <EmptyState title="No users found." />
            )}

            {!loading && !error && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Company Access</th>
                      <th className="px-4 py-3 font-medium">Chatbot Access</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u._id}
                        onClick={() => navigate(`/users/${u._id}`)}
                        className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {u.role.replaceAll("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {u.companyAccess === "ALL"
                            ? "All"
                            : u.companyAccess.length
                            ? u.companyAccess.join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {u.role === "SUPER_ADMIN"
                            ? "All"
                            : u.chatbotAccessCount
                            ? `${u.chatbotAccessCount} chatbot${u.chatbotAccessCount === 1 ? "" : "s"}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString()
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && users.length > 0 && (
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onChange={load}
              />
            )}
          </div>
        </>
      )}

      <UserFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => load(1)}
      />
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onSaved={() => {}}
      />
    </div>
  );
}
