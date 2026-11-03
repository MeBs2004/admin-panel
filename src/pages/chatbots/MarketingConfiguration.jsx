import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Toggle from "../../components/ui/Toggle.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const STATUS_COLORS = { new: "bg-blue-50 text-blue-700", contacted: "bg-amber-50 text-amber-700", converted: "bg-emerald-50 text-emerald-700", closed: "bg-gray-100 text-gray-500" };

export default function MarketingConfiguration() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [tab, setTab] = useState("profile");

  return (
    <div>
      <PageHeader title="Marketing Configuration" description="Business profile, services & AI capabilities, lead settings, and the leads your chatbot captures." />
      <div className="animate-fade-in-up panel-card rounded-2xl border border-gray-200 bg-white shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs
          tabs={[
            { value: "profile", label: "Business Profile" },
            { value: "services", label: "Services & Capabilities" },
            { value: "leadSettings", label: "Lead Settings" },
            { value: "leads", label: "Leads" },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="p-5">
          {tab === "profile" && <BusinessProfileTab chatbotId={id} showToast={showToast} />}
          {tab === "services" && <ServicesCapabilitiesTab chatbotId={id} showToast={showToast} />}
          {tab === "leadSettings" && <LeadSettingsTab chatbotId={id} showToast={showToast} />}
          {tab === "leads" && <LeadsTab chatbotId={id} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ==================== shared config load/save ====================

function useMarketingConfig(chatbotId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/marketing/config`);
      setConfig(res.data.config);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const save = async (patch) => {
    const res = await api.put(`/chatbots/${chatbotId}/marketing/config`, patch);
    setConfig(res.data.config);
    return res.data.config;
  };

  return { config, setConfig, loading, error, load, save };
}

// ==================== BUSINESS PROFILE ====================

const BUSINESS_PROFILE_FIELDS = [
  { key: "businessName", label: "Business / Company Name", required: true },
  { key: "website", label: "Website URL" },
  { key: "location", label: "Location" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "industriesServed", label: "Industries Served" },
  { key: "contactInfo", label: "Contact Information" },
];

export function BusinessProfileTab({ chatbotId, showToast }) {
  const { config, loading, error, load, save } = useMarketingConfig(chatbotId);
  const [form, setForm] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setForm(config.businessProfile || {});
  }, [config]);

  useEffect(() => {
    api.get("/marketing-defaults/catalog").then((res) => setCatalog(res.data)).catch(() => {});
  }, []);

  if (loading || !form) return <SkeletonLine className="h-64 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName?.trim()) {
      showToast("Business name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await save({ businessProfile: form });
      showToast("Business profile saved.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {BUSINESS_PROFILE_FIELDS.map((f) => (
          <Input key={f.key} label={f.label} value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} required={f.required} />
        ))}
        <Select
          label="Business Type"
          value={form.businessType || ""}
          onChange={(e) => set("businessType", e.target.value)}
          options={[{ value: "", label: "Select a type…" }, ...(catalog?.businessTypes || []).map((t) => ({ value: t, label: t }))]}
        />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Business Description</span>
        <textarea
          value={form.description || ""}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Business Goals</span>
        <textarea
          value={form.businessGoals || ""}
          onChange={(e) => set("businessGoals", e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
        />
      </label>
      <Button type="submit" loading={saving}>Save Business Profile</Button>
    </form>
  );
}

// ==================== SERVICES & CAPABILITIES ====================

export function ServicesCapabilitiesTab({ chatbotId, showToast }) {
  const { config, loading, error, load, save } = useMarketingConfig(chatbotId);
  const [catalog, setCatalog] = useState(null);
  const [services, setServices] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get("/marketing-defaults/catalog").then((res) => setCatalog(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (config) {
      setServices(config.enabledServiceKeys || []);
      setCapabilities(config.enabledCapabilityKeys || []);
    }
  }, [config]);

  if (loading || !catalog) return <SkeletonLine className="h-64 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const toggleService = (key) => setServices((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  const toggleCapability = (key) => setCapabilities((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));

  const saveAll = async () => {
    setSaving(true);
    try {
      await save({ enabledServiceKeys: services, enabledCapabilityKeys: capabilities });
      showToast("Services & capabilities saved.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await saveAll();
      await api.post(`/chatbots/${chatbotId}/marketing/config/publish`);
      showToast("Marketing configuration published — live on your chatbot.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Marketing Services You Offer</h3>
        <div className="space-y-4">
          {catalog.serviceCategories.map((cat, catIndex) => (
            <div key={cat.key} className="stagger-in" style={{ "--stagger-index": catIndex }}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {cat.services.map((s) => {
                  const on = services.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleService(s.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-105 ${on ? "border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-500/10" : "border-gray-200 text-gray-600 dark:border-[var(--border)] dark:text-gray-300"}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 dark:border-[var(--border)]">
        <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">AI Capabilities</h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Only enabled capabilities are offered by your chatbot — everything else stays switched off.</p>
        <div className="space-y-3">
          {catalog.capabilities.map((c, capIndex) => (
            <div
              key={c.key}
              className={`stagger-in rounded-xl border p-3 transition-colors duration-200 ${capabilities.includes(c.key) ? "border-violet-300 bg-violet-50/40 dark:border-violet-500/40 dark:bg-violet-500/5" : "border-gray-200 dark:border-[var(--border)]"}`}
              style={{ "--stagger-index": capIndex }}
            >
              <Toggle checked={capabilities.includes(c.key)} onChange={() => toggleCapability(c.key)} label={c.label} description={c.description} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 pt-5 dark:border-[var(--border)]">
        <Button variant="secondary" onClick={saveAll} loading={saving}>Save Draft</Button>
        <Button onClick={publish} loading={publishing}>Publish</Button>
      </div>
    </div>
  );
}

// ==================== LEAD SETTINGS ====================

const LEAD_FIELD_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Number" },
  { key: "companyName", label: "Company Name" },
  { key: "website", label: "Website" },
  { key: "requiredServices", label: "Required Services" },
  { key: "budget", label: "Marketing Budget" },
  { key: "timeline", label: "Project Timeline" },
];

export function LeadSettingsTab({ chatbotId, showToast }) {
  const { config, loading, error, load, save } = useMarketingConfig(chatbotId);
  const [form, setForm] = useState(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setForm(config.leadSettings || { enabled: true, requiredFields: ["name", "phone"], qualificationQuestions: [], humanHandoffEnabled: true, ctaLabel: "Request a Quote" });
  }, [config]);

  if (loading || !form) return <SkeletonLine className="h-64 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const toggleField = (key) =>
    setForm((f) => ({ ...f, requiredFields: f.requiredFields.includes(key) ? f.requiredFields.filter((k) => k !== key) : [...f.requiredFields, key] }));

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setForm((f) => ({ ...f, qualificationQuestions: [...f.qualificationQuestions, newQuestion.trim()] }));
    setNewQuestion("");
  };
  const removeQuestion = (i) => setForm((f) => ({ ...f, qualificationQuestions: f.qualificationQuestions.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save({ leadSettings: form });
      showToast("Lead settings saved.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Toggle checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} label="Enable lead collection" description="Show a 'Request a Quote' option in the chat." />
      <Toggle checked={form.humanHandoffEnabled} onChange={(v) => setForm((f) => ({ ...f, humanHandoffEnabled: v }))} label="Allow human handoff" description="Let visitors be connected to a human teammate." />
      <Input label="Call-to-action label" value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Fields to collect</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_FIELD_OPTIONS.map((f) => {
            const on = form.requiredFields.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleField(f.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${on ? "border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-500 dark:bg-primary-500/10" : "border-gray-200 text-gray-600 dark:border-[var(--border)] dark:text-gray-300"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Qualification questions</p>
        <div className="mb-2 flex gap-2">
          <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="e.g. What's your monthly marketing budget?" className="flex-1" />
          <Button type="button" variant="secondary" onClick={addQuestion}>Add</Button>
        </div>
        <ul className="space-y-1.5">
          {form.qualificationQuestions.map((q, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-[var(--border)]">
              {q}
              <button type="button" onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500">✕</button>
            </li>
          ))}
        </ul>
      </div>

      <Button type="submit" loading={saving}>Save Lead Settings</Button>
    </form>
  );
}

// ==================== LEADS ====================

export function LeadsTab({ chatbotId, showToast }) {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/marketing/leads`, { params: status ? { status } : {} });
      setLeads(res.data.leads);
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
  }, [chatbotId, status]);

  const changeStatus = async (leadId, newStatus) => {
    try {
      await api.patch(`/chatbots/${chatbotId}/marketing/leads/${leadId}/status`, { status: newStatus });
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["", "new", "contacted", "converted", "closed"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${status === s ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-500/10" : "border-gray-200 text-gray-500 dark:border-[var(--border)]"}`}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "All"} {s ? `(${counts[s] || 0})` : `(${counts.total || 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonLine className="h-32 w-full" />
      ) : leads.length === 0 ? (
        <EmptyState title="No leads yet" description={'When a visitor uses the lead-capture option in your chatbot, their details show up here.'} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Budget</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[var(--border)]">
              {leads.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-2.5 font-mono text-xs">{l.referenceId}</td>
                  <td className="px-4 py-2.5">{l.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.phone || l.email}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.companyName || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.budget || "—"}</td>
                  <td className="px-4 py-2.5">
                    <select value={l.status} onChange={(e) => changeStatus(l._id, e.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[l.status]}`}>
                      {["new", "contacted", "converted", "closed"].map((s) => (
                        <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
