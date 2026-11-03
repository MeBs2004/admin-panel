import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiInbox, FiClock, FiPhoneCall, FiFileText, FiSend, FiCheckCircle, FiXCircle, FiArchive, FiPaperclip, FiDownload, FiMapPin, FiUser } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const STATUSES = ["new", "under_review", "supplier_contacted", "quotation_in_progress", "quotation_sent", "won", "lost", "closed"];
const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s, s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())]));
const STATUS_COLORS = {
  new: "bg-sky-50 text-sky-700",
  under_review: "bg-amber-50 text-amber-700",
  supplier_contacted: "bg-indigo-50 text-indigo-700",
  quotation_in_progress: "bg-violet-50 text-violet-700",
  quotation_sent: "bg-teal-50 text-teal-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-700",
  closed: "bg-gray-100 text-gray-500",
};
const STAT_ICONS = { total: FiInbox, new: FiInbox, under_review: FiClock, supplier_contacted: FiPhoneCall, quotation_in_progress: FiFileText, quotation_sent: FiSend, won: FiCheckCircle, lost: FiXCircle, closed: FiArchive };

export default function EnergyEnquiries() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${id}/energy/enquiries`, { params: { ...(status ? { status } : {}), ...(search ? { search } : {}) } });
      setEnquiries(res.data.enquiries);
      setCounts(res.data.counts);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  return (
    <div>
      <PageHeader title="RFQ / Enquiries" description="Quotation requests collected from your Energy chatbot." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {["total", ...STATUSES].map((s, i) => (
          <StatCard key={s} label={s === "total" ? "Total" : STATUS_LABELS[s]} value={counts[s] ?? 0} icon={STAT_ICONS[s]} accent={s === "won" ? "success" : s === "lost" ? "rose" : "primary"} index={i} />
        ))}
      </div>

      <div className="panel-card rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]} className="w-auto" />
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Reference, name, email, company…" />
          <Button variant="secondary" onClick={load}>Search</Button>
        </div>

        {error && <ErrorState message={error} onRetry={load} />}
        {loading ? (
          <SkeletonLine className="h-32 w-full" />
        ) : enquiries.length === 0 ? (
          <EmptyState title="No enquiries yet" description="RFQs submitted through this chatbot's widget will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Fuel</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Submitted</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {enquiries.map((e) => (
                  <tr key={e._id} onClick={() => setSelected(e._id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2 font-mono text-xs">{e.referenceId}</td>
                    <td className="px-3 py-2">{e.customer.name} {e.customer.companyName ? `(${e.customer.companyName})` : ""}</td>
                    <td className="px-3 py-2">{e.fuelKey}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span></td>
                    <td className="px-3 py-2 text-xs text-gray-400">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <EnquiryDetailModal chatbotId={id} enquiryId={selected} onClose={() => setSelected(null)} onChanged={load} showToast={showToast} />}
    </div>
  );
}

function EnquiryDetailModal({ chatbotId, enquiryId, onClose, onChanged, showToast }) {
  const [enquiry, setEnquiry] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // Task 1 — attachments (loaded separately from the enquiry detail so a
  // slow/failed attachment fetch never blocks the rest of the modal).
  const [attachments, setAttachments] = useState(null);
  const [attachmentsError, setAttachmentsError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  // Task 3 — assignment.
  const [eligibleUsers, setEligibleUsers] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    const res = await api.get(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}`);
    setEnquiry(res.data.enquiry);
  };

  const loadAttachments = async () => {
    setAttachmentsError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/attachments`);
      setAttachments(res.data.attachments);
    } catch (err) {
      setAttachmentsError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiryId]);

  // The eligible-assignee list depends on the enquiry's own companyId,
  // which only arrives once `load()` resolves — reuses the existing
  // team listing endpoint (already documented as "used by assignee
  // pickers"), not a new permissions/endpoint of its own.
  useEffect(() => {
    if (!enquiry?.companyId) return;
    api
      .get("/users", { params: { companyId: enquiry.companyId, limit: 100 } })
      .then((res) => setEligibleUsers(res.data.users))
      .catch(() => setEligibleUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry?.companyId]);

  const downloadAttachment = async (fileId, filename) => {
    setDownloadingId(fileId);
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/attachments/${fileId}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "attachment";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(getErrorMessage(err) || "Download failed.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const assign = async (assignedTo) => {
    setAssigning(true);
    try {
      await api.patch(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/assign`, { assignedTo: assignedTo || null });
      showToast(assignedTo ? "Enquiry assigned." : "Enquiry unassigned.");
      await load();
      onChanged();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setAssigning(false);
    }
  };

  const changeStatus = async (status) => {
    setSavingStatus(true);
    try {
      await api.patch(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/status`, { status });
      showToast("Status updated.");
      load();
      onChanged();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSavingStatus(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/notes`, { text: noteText.trim() });
      setNoteText("");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const notifySuppliers = async () => {
    setNotifying(true);
    try {
      const res = await api.post(`/chatbots/${chatbotId}/energy/enquiries/${enquiryId}/notify-suppliers`);
      const sentCount = res.data.results.filter((r) => r.sent).length;
      if (sentCount > 0) showToast(`Notified ${sentCount} supplier(s).`);
      else showToast("No emails were actually sent — check SMTP configuration.", "error");
      load();
      onChanged();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setNotifying(false);
    }
  };

  if (!enquiry) return <Modal open onClose={onClose} title="Loading…"><div className="p-5"><SkeletonLine className="h-24 w-full" /></div></Modal>;

  return (
    <Modal open onClose={onClose} title={`Enquiry ${enquiry.referenceId}`} wide>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</p>
            <p className="text-sm">{enquiry.customer.name}</p>
            {enquiry.customer.companyName && <p className="text-sm text-gray-500">{enquiry.customer.companyName}</p>}
            <p className="text-sm text-gray-500">{enquiry.customer.email}</p>
            {enquiry.customer.phone && <p className="text-sm text-gray-500">{enquiry.customer.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Project</p>
            <p className="text-sm">Fuel: {enquiry.fuelKey}</p>
            {enquiry.purchaseTimeline && <p className="text-sm text-gray-500">Timeline: {enquiry.purchaseTimeline}</p>}
            {enquiry.additionalRequirements && <p className="text-sm text-gray-500">{enquiry.additionalRequirements}</p>}
            <p className="text-xs text-gray-400">Source: {enquiry.source}</p>
          </div>
        </div>

        <LocationSection enquiry={enquiry} />

        {enquiry.requiredEquipment?.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Required equipment</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300">
              {enquiry.requiredEquipment.map((e, i) => <li key={i}>• {e.name} — qty {e.qty ?? "—"} {e.unit}</li>)}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><FiPaperclip className="h-3.5 w-3.5" /> Attachments</p>
          {attachmentsError ? (
            <ErrorState message={attachmentsError} onRetry={loadAttachments} />
          ) : attachments === null ? (
            <SkeletonLine className="h-8 w-full" />
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-400">No files were attached to this enquiry.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {attachments.map((a) => (
                <li key={a.fileId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm dark:border-[var(--border)]">
                  <span className="truncate">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{a.filename}</span>{" "}
                    <span className="text-xs text-gray-400">
                      {a.contentType || "unknown type"} · {formatFileSize(a.size)}
                      {a.uploadedAt ? ` · ${new Date(a.uploadedAt).toLocaleString()}` : ""}
                    </span>
                  </span>
                  <Button variant="secondary" className="flex-shrink-0 !px-2.5 !py-1 text-xs" onClick={() => downloadAttachment(a.fileId, a.filename)} loading={downloadingId === a.fileId}>
                    <FiDownload className="h-3.5 w-3.5" /> Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><FiUser className="h-3.5 w-3.5" /> Assigned to</p>
          {eligibleUsers === null ? (
            <SkeletonLine className="h-8 w-full" />
          ) : (
            <Select
              value={enquiry.assignedTo?._id || ""}
              onChange={(e) => assign(e.target.value || null)}
              disabled={assigning}
              options={[{ value: "", label: "Unassigned" }, ...eligibleUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))]}
              className="w-auto"
            />
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Consent &amp; selected suppliers</p>
          <p className="text-sm">{enquiry.consent.given ? `Consent given${enquiry.consent.givenAt ? ` on ${new Date(enquiry.consent.givenAt).toLocaleString()}` : ""}` : "No consent recorded"}</p>
          {enquiry.selectedSupplierIds?.length > 0 && (
            <ul className="text-sm text-gray-700 dark:text-gray-300">
              {enquiry.selectedSupplierIds.map((s) => <li key={s._id}>• {s.name} ({s.verificationStatus})</li>)}
            </ul>
          )}
          {enquiry.consent.given && enquiry.selectedSupplierIds?.length > 0 && (
            <Button variant="secondary" className="mt-2" onClick={notifySuppliers} loading={notifying}>Notify selected suppliers</Button>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => changeStatus(s)} disabled={savingStatus || s === enquiry.status} className={`rounded-full px-2.5 py-1 text-xs ${s === enquiry.status ? STATUS_COLORS[s] : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Status history</p>
          <ul className="text-xs text-gray-500">
            {enquiry.statusHistory.map((h, i) => <li key={i}>{new Date(h.changedAt).toLocaleString()} — {STATUS_LABELS[h.status]}{h.note ? `: ${h.note}` : ""}</li>)}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Internal notes</p>
          <ul className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            {enquiry.internalNotes.map((n, i) => <li key={i} className="border-b border-gray-50 py-1 dark:border-white/5">{n.text} <span className="text-xs text-gray-400">({new Date(n.createdAt).toLocaleDateString()})</span></li>)}
          </ul>
          <div className="flex gap-2">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:bg-[var(--surface)] dark:border-[var(--border)]" />
            <Button variant="secondary" onClick={addNote}>Add</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function formatFileSize(bytes) {
  if (bytes == null) return "unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Task 2 — priority: complete/partial structured location first (only
// the fields that are actually present), then the legacy free-text
// field, then an honest "not provided" — never a raw JSON dump.
function LocationSection({ enquiry }) {
  const location = enquiry.location || {};
  const hasStructured = Boolean(location.city || location.state || location.country || location.postalCode);

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><FiMapPin className="h-3.5 w-3.5" /> Project Location</p>
      {hasStructured ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-4">
          {location.city && (
            <div>
              <dt className="text-xs text-gray-400">City</dt>
              <dd>{location.city}</dd>
            </div>
          )}
          {location.state && (
            <div>
              <dt className="text-xs text-gray-400">State</dt>
              <dd>{location.state}</dd>
            </div>
          )}
          {location.country && (
            <div>
              <dt className="text-xs text-gray-400">Country</dt>
              <dd>{location.country}</dd>
            </div>
          )}
          {location.postalCode && (
            <div>
              <dt className="text-xs text-gray-400">Postal Code</dt>
              <dd>{location.postalCode}</dd>
            </div>
          )}
        </dl>
      ) : enquiry.projectLocation ? (
        <p className="text-sm text-gray-700 dark:text-gray-300">{enquiry.projectLocation}</p>
      ) : (
        <p className="text-sm text-gray-400">Location not provided</p>
      )}
      {hasStructured && enquiry.projectLocation && <p className="mt-1 text-xs text-gray-400">As entered: {enquiry.projectLocation}</p>}
    </div>
  );
}
