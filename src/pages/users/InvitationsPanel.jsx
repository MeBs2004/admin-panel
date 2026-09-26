import { useEffect, useState } from "react";
import { FiMail } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";

export default function InvitationsPanel() {
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newLink, setNewLink] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/invitations")
      .then((res) => setInvitations(res.data.invitations))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const revoke = async (id) => {
    setBusy(true);
    try {
      await api.post(`/invitations/${id}/revoke`);
      showToast("Invitation revoked.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const resend = async (id) => {
    setBusy(true);
    try {
      const res = await api.post(`/invitations/${id}/resend`);
      setNewLink(`${window.location.origin}/accept-invite/${res.data.rawToken}`);
      showToast(res.data.message);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
      {loading && <SkeletonTable />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && invitations.length === 0 && (
        <EmptyState icon={FiMail} title="No invitations yet." />
      )}

      {!loading && !error && invitations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Companies</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv._id} className="border-b border-gray-50 dark:border-white/5">
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{inv.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{inv.role.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {inv.companyAccess.map((c) => c.companyId).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => resend(inv._id)} loading={busy}>
                          Resend
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            setConfirm({
                              title: "Revoke Invitation?",
                              message: `The invitation for ${inv.email} will no longer work.`,
                              action: () => revoke(inv._id),
                            })
                          }
                        >
                          Revoke
                        </Button>
                      </div>
                    )}
                    {inv.status === "EXPIRED" && (
                      <Button variant="secondary" onClick={() => resend(inv._id)} loading={busy}>
                        Resend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
      />

      <Modal
        open={!!newLink}
        onClose={() => setNewLink(null)}
        title="New Invite Link"
        footer={<Button onClick={() => setNewLink(null)}>Done</Button>}
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Email delivery isn't configured — share this link with the invitee directly. The old link no longer works.
        </p>
        <code className="block break-all rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/10 dark:text-gray-100">
          {newLink}
        </code>
      </Modal>
    </div>
  );
}
