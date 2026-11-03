import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiUpload, FiCheckCircle, FiDownload, FiClock } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Toggle from "../../components/ui/Toggle.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const GROUP_LABELS = { gas_fuel: "Gas & Fuel Solutions", renewable: "Renewable Energy", power_storage: "Power & Storage", other: "Other" };
const QUESTION_TYPES = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "number_unit", label: "Number with unit" },
  { value: "dropdown", label: "Dropdown" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "date", label: "Date" },
  { value: "file", label: "File upload" },
];
const NEEDS_OPTIONS = ["dropdown", "single_choice", "multiple_choice"];
const OUTPUT_TYPES = [
  { value: "bom", label: "Bill of Materials" },
  { value: "equipment_recommendation", label: "Equipment Recommendation" },
  { value: "system_sizing", label: "System Sizing" },
  { value: "technical_solution_proposal", label: "Technical Solution Proposal" },
  { value: "project_requirement_summary", label: "Project Requirement Summary" },
  { value: "quotation_request", label: "Quotation Request" },
];
const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  archived: "bg-gray-100 text-gray-400",
};

export default function EnergyConfiguration() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [tab, setTab] = useState("fuels");

  return (
    <div>
      <PageHeader title="Energy Configuration" description="Fuels & offerings, customer questions, and your equipment catalogue." />
      <div className="animate-fade-in-up panel-card rounded-2xl border border-gray-200 bg-white shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs tabs={[{ value: "fuels", label: "Fuels & Offerings" }, { value: "questions", label: "Questions" }, { value: "equipment", label: "Equipment" }, { value: "solutions", label: "BOM & Solutions" }, { value: "suppliers", label: "Suppliers" }]} active={tab} onChange={setTab} />
        <div className="p-5">
          {tab === "fuels" && <FuelsTab chatbotId={id} showToast={showToast} goToSolutions={() => setTab("solutions")} />}
          {tab === "questions" && <QuestionsTab chatbotId={id} showToast={showToast} />}
          {tab === "equipment" && <EquipmentTab chatbotId={id} showToast={showToast} />}
          {tab === "solutions" && <SolutionsTab chatbotId={id} showToast={showToast} />}
          {tab === "suppliers" && <SuppliersTab chatbotId={id} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ==================== FUELS & OFFERINGS ====================

export function FuelsTab({ chatbotId, showToast, goToSolutions }) {
  const [fuels, setFuels] = useState(null);
  const [offerings, setOfferings] = useState({}); // fuelKey -> { products: [], projectTypes: [] }
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newFuelLabel, setNewFuelLabel] = useState("");
  const [newOfferingLabel, setNewOfferingLabel] = useState({});
  // Task 5 — publish warnings: missing-template combinations never
  // block publishing, they're surfaced in a confirmation modal so the
  // admin notices the gap at configuration time instead of only when
  // a real visitor hits "noTemplateConfigured" in the live journey.
  const [publishWarnings, setPublishWarnings] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [fuelsRes, configRes] = await Promise.all([api.get(`/chatbots/${chatbotId}/energy/fuels`), api.get(`/chatbots/${chatbotId}/energy/config`)]);
      setFuels(fuelsRes.data.fuels);
      setConfig(configRes.data.config);
      const enabledFuels = fuelsRes.data.fuels.filter((f) => configRes.data.config.enabledFuelKeys.includes(f.key));
      const entries = await Promise.all(
        enabledFuels.map(async (f) => {
          const [products, projectTypes] = await Promise.all([
            api.get(`/chatbots/${chatbotId}/energy/product-services`, { params: { fuelKey: f.key } }),
            api.get(`/chatbots/${chatbotId}/energy/project-types`, { params: { fuelKey: f.key } }),
          ]);
          return [f.key, { products: products.data.items, projectTypes: projectTypes.data.items }];
        })
      );
      setOfferings(Object.fromEntries(entries));
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

  const saveSelection = async (patch) => {
    try {
      const res = await api.put(`/chatbots/${chatbotId}/energy/config`, patch);
      setConfig(res.data.config);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const toggleFuel = async (key) => {
    const enabledFuelKeys = config.enabledFuelKeys.includes(key) ? config.enabledFuelKeys.filter((k) => k !== key) : [...config.enabledFuelKeys, key];
    await saveSelection({ enabledFuelKeys });
    await load();
  };

  const addCustomFuel = async () => {
    if (!newFuelLabel.trim()) return;
    try {
      await api.post(`/chatbots/${chatbotId}/energy/fuels`, { label: newFuelLabel.trim() });
      setNewFuelLabel("");
      showToast("Custom fuel added.");
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const toggleOffering = async (field, itemId) => {
    const current = field === "enabledProductServiceIds" ? config.enabledProductServiceIds : config.enabledProjectTypeIds;
    const next = current.includes(itemId) ? current.filter((x) => x !== itemId) : [...current, itemId];
    await saveSelection({ [field]: next });
  };

  const addCustomOffering = async (fuelKey, kind) => {
    const label = (newOfferingLabel[`${fuelKey}:${kind}`] || "").trim();
    if (!label) return;
    try {
      await api.post(`/chatbots/${chatbotId}/energy/${kind === "product" ? "product-services" : "project-types"}`, { fuelKey, label });
      setNewOfferingLabel((s) => ({ ...s, [`${fuelKey}:${kind}`]: "" }));
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const confirmPublish = async () => {
    try {
      const warnings = await api.get(`/chatbots/${chatbotId}/energy/config/publish-warnings`);
      if (warnings.data.warnings.missingTemplates.length > 0) {
        setPublishWarnings(warnings.data.warnings.missingTemplates);
        return;
      }
      await doPublish();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      const res = await api.post(`/chatbots/${chatbotId}/energy/config/publish`);
      setConfig(res.data.config);
      setPublishWarnings(null);
      showToast("Energy configuration published.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <SkeletonLine className="h-32 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const byGroup = fuels.reduce((acc, f) => {
    (acc[f.group] ||= []).push(f);
    return acc;
  }, {});
  const selectedFuels = fuels.filter((f) => config.enabledFuelKeys.includes(f.key));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
          {config.status === "PUBLISHED" && <FiCheckCircle className="h-3.5 w-3.5" />}
          {config.status}
        </span>
        <Button onClick={confirmPublish} variant="secondary">Publish configuration</Button>
      </div>

      {publishWarnings && (
        <Modal open onClose={() => setPublishWarnings(null)} title="Missing solution templates">
          <div className="space-y-3 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Visitors will still be able to submit enquiries for the project type(s) below, but automated BOM/solution generation won't be available until an approved solution template exists. This is a warning, not a block — you can publish anyway.
            </p>
            <ul className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
              {publishWarnings.map((w) => (
                <li key={w.projectTypeId}>• {w.fuelKey.toUpperCase()} — {w.projectTypeLabel}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => { setPublishWarnings(null); goToSolutions?.(); }}>Configure solution templates</Button>
              <Button onClick={doPublish} loading={publishing}>Publish anyway</Button>
            </div>
          </div>
        </Modal>
      )}

      {Object.entries(GROUP_LABELS).map(([group, label]) =>
        byGroup[group]?.length ? (
          <div key={group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {byGroup[group].map((f) => (
                <button
                  key={f.key}
                  onClick={() => toggleFuel(f.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${f.enabled ? "border-primary-400 bg-primary-50/70 dark:border-primary-500 dark:bg-primary-500/10" : "border-gray-200 dark:border-[var(--border)]"}`}
                >
                  {f.label} {f.isCustom && <span className="text-xs text-gray-400">(custom)</span>}
                </button>
              ))}
            </div>
          </div>
        ) : null
      )}

      <div className="flex items-end gap-2">
        <Input label="Add a custom fuel/solution" value={newFuelLabel} onChange={(e) => setNewFuelLabel(e.target.value)} placeholder="e.g. Geothermal Energy" />
        <Button onClick={addCustomFuel}><FiPlus className="h-4 w-4" /> Add</Button>
      </div>

      {selectedFuels.map((fuel) => {
        const data = offerings[fuel.key] || { products: [], projectTypes: [] };
        return (
          <div key={fuel.key} className="rounded-xl border border-gray-200 p-4 dark:border-[var(--border)]">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{fuel.label}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Products & Services</p>
                <div className="flex flex-col gap-1.5">
                  {data.products.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={config.enabledProductServiceIds.includes(p._id)} onChange={() => toggleOffering("enabledProductServiceIds", p._id)} className="rounded border-gray-300" />
                      {p.label} {p.isCustom && <span className="text-xs text-gray-400">(custom)</span>}
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add custom…"
                    value={newOfferingLabel[`${fuel.key}:product`] || ""}
                    onChange={(e) => setNewOfferingLabel((s) => ({ ...s, [`${fuel.key}:product`]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]"
                  />
                  <button onClick={() => addCustomOffering(fuel.key, "product")} className="text-gray-400 hover:text-primary-500"><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Project Types</p>
                <div className="flex flex-col gap-1.5">
                  {data.projectTypes.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={config.enabledProjectTypeIds.includes(p._id)} onChange={() => toggleOffering("enabledProjectTypeIds", p._id)} className="rounded border-gray-300" />
                      {p.label} {p.isCustom && <span className="text-xs text-gray-400">(custom)</span>}
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add custom…"
                    value={newOfferingLabel[`${fuel.key}:type`] || ""}
                    onChange={(e) => setNewOfferingLabel((s) => ({ ...s, [`${fuel.key}:type`]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]"
                  />
                  <button onClick={() => addCustomOffering(fuel.key, "type")} className="text-gray-400 hover:text-primary-500"><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {selectedFuels.length === 0 && <EmptyState title="No fuels enabled yet" description="Select at least one fuel above to configure its products and project types." />}
    </div>
  );
}

// ==================== QUESTIONS ====================

export function QuestionsTab({ chatbotId, showToast }) {
  const [fuels, setFuels] = useState([]);
  const [fuelKey, setFuelKey] = useState("");
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectTypeId, setProjectTypeId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadFuels = async () => {
    try {
      const [fuelsRes, configRes] = await Promise.all([api.get(`/chatbots/${chatbotId}/energy/fuels`), api.get(`/chatbots/${chatbotId}/energy/config`)]);
      const enabled = fuelsRes.data.fuels.filter((f) => configRes.data.config.enabledFuelKeys.includes(f.key));
      setFuels(enabled);
      if (enabled.length > 0 && !fuelKey) setFuelKey(enabled[0].key);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  useEffect(() => {
    loadFuels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const loadForFuel = async () => {
    if (!fuelKey) return;
    setLoading(true);
    setError("");
    try {
      const [ptRes, qRes] = await Promise.all([
        api.get(`/chatbots/${chatbotId}/energy/project-types`, { params: { fuelKey } }),
        api.get(`/chatbots/${chatbotId}/energy/questions`, { params: { fuelKey, ...(projectTypeId ? { projectTypeId } : {}) } }),
      ]);
      setProjectTypes(ptRes.data.items);
      setQuestions(qRes.data.questions.filter((q) => (projectTypeId ? q.projectTypeId === projectTypeId : !q.projectTypeId)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadForFuel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelKey, projectTypeId]);

  const move = async (index, direction) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    try {
      await api.post(`/chatbots/${chatbotId}/energy/questions/reorder`, { fuelKey, projectTypeId: projectTypeId || null, orderedIds: next.map((q) => q._id) });
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      loadForFuel();
    }
  };

  const toggleActive = async (q) => {
    try {
      await api.patch(`/chatbots/${chatbotId}/energy/questions/${q._id}`, { active: !q.active });
      loadForFuel();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const remove = async (q) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/energy/questions/${q._id}`);
      showToast("Question deleted.");
      loadForFuel();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (fuels.length === 0) return <EmptyState title="No fuels enabled" description="Enable a fuel in the Fuels & Offerings tab first." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Fuel" value={fuelKey} onChange={(e) => { setFuelKey(e.target.value); setProjectTypeId(""); }} options={fuels.map((f) => ({ value: f.key, label: f.label }))} className="w-auto" />
        <Select label="Project type (optional)" value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value)} options={[{ value: "", label: "All project types" }, ...projectTypes.map((p) => ({ value: p._id, label: p.label }))]} className="w-auto" />
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus className="h-4 w-4" /> Add question</Button>
      </div>

      {error && <ErrorState message={error} onRetry={loadForFuel} />}
      {loading ? (
        <SkeletonLine className="h-24 w-full" />
      ) : questions.length === 0 ? (
        <EmptyState title="No questions yet" description="Add questions to collect what you need from visitors for this fuel." />
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q._id} className={`flex items-center justify-between rounded-xl border p-3 ${q.active ? "border-gray-200 dark:border-[var(--border)]" : "border-gray-100 opacity-60 dark:border-white/5"}`}>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{q.label}</p>
                <p className="text-xs text-gray-400">
                  {QUESTION_TYPES.find((t) => t.value === q.type)?.label} · {q.required ? "Required" : "Optional"}
                  {q.dependsOnQuestionId && " · Conditional"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><FiArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === questions.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><FiArrowDown className="h-4 w-4" /></button>
                <Toggle checked={q.active} onChange={() => toggleActive(q)} />
                <button onClick={() => { setEditing(q); setModalOpen(true); }} className="text-xs text-primary-500 hover:underline">Edit</button>
                <button onClick={() => remove(q)} className="text-gray-400 hover:text-red-500"><FiTrash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chatbotId={chatbotId}
        fuelKey={fuelKey}
        projectTypeId={projectTypeId}
        existingQuestions={questions}
        editing={editing}
        showToast={showToast}
        onSaved={() => { setModalOpen(false); loadForFuel(); }}
      />
    </div>
  );
}

export function QuestionModal({ open, onClose, chatbotId, fuelKey, projectTypeId, existingQuestions, editing, showToast, onSaved }) {
  const empty = { label: "", description: "", placeholder: "", type: "short_text", unit: "", options: "", required: true, allowUnknown: false, dependsOnQuestionId: "", dependsOnCondition: "equals", dependsOnValue: "", allowedFileTypes: [], maxFileSizeMb: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  // Task 6 — the supported-type catalogue and size cap come from the
  // backend's own fileUploadPolicy service (single source of truth
  // with what the upload endpoint actually enforces), never a second,
  // hand-maintained list in the frontend.
  const [filePolicy, setFilePolicy] = useState(null);

  useEffect(() => {
    if (!open) return;
    api.get(`/chatbots/${chatbotId}/energy/file-upload-policy`).then((res) => setFilePolicy(res.data)).catch(() => setFilePolicy({ supportedTypes: [], defaultMaxSizeMb: 10, hardMaxSizeMb: 25 }));
  }, [open, chatbotId]);

  useEffect(() => {
    if (editing) setForm({ ...empty, ...editing, options: (editing.options || []).join(", "), dependsOnQuestionId: editing.dependsOnQuestionId || "", dependsOnValue: editing.dependsOnValue || "", allowedFileTypes: editing.allowedFileTypes || [], maxFileSizeMb: editing.maxFileSizeMb ?? "" });
    else setForm(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  const toggleFileType = (mime) => setForm((f) => ({ ...f, allowedFileTypes: f.allowedFileTypes.includes(mime) ? f.allowedFileTypes.filter((t) => t !== mime) : [...f.allowedFileTypes, mime] }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        fuelKey,
        projectTypeId: projectTypeId || null,
        options: NEEDS_OPTIONS.includes(form.type) ? form.options.split(",").map((s) => s.trim()).filter(Boolean) : [],
        dependsOnQuestionId: form.dependsOnQuestionId || null,
        allowedFileTypes: form.type === "file" ? form.allowedFileTypes : [],
        maxFileSizeMb: form.type === "file" && form.maxFileSizeMb !== "" ? Number(form.maxFileSizeMb) : null,
      };
      if (editing) await api.patch(`/chatbots/${chatbotId}/energy/questions/${editing._id}`, payload);
      else await api.post(`/chatbots/${chatbotId}/energy/questions`, payload);
      showToast(editing ? "Question updated." : "Question added.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit question" : "Add question"} wide>
      <div className="space-y-3 p-5">
        <Input label="Question" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input label="Description / help text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Placeholder" value={form.placeholder} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={QUESTION_TYPES} />
        {form.type === "number_unit" && <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg/day" />}
        {NEEDS_OPTIONS.includes(form.type) && <Input label="Options (comma-separated)" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="Option A, Option B, Option C" />}
        {form.type === "file" && (
          <div className="rounded-xl border border-gray-200 p-3 dark:border-[var(--border)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">File upload settings</p>
            {!filePolicy ? (
              <SkeletonLine className="h-16 w-full" />
            ) : (
              <>
                <p className="mb-1.5 text-xs text-gray-500">Allowed file types (leave none selected to use the platform default)</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {filePolicy.supportedTypes.map((t) => (
                    <label key={t.mime} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs ${form.allowedFileTypes.includes(t.mime) ? "border-primary-400 bg-primary-50/70 dark:border-primary-500 dark:bg-primary-500/10" : "border-gray-200 text-gray-600 dark:border-[var(--border)] dark:text-gray-300"}`}>
                      <input type="checkbox" className="sr-only" checked={form.allowedFileTypes.includes(t.mime)} onChange={() => toggleFileType(t.mime)} />
                      {t.label}
                    </label>
                  ))}
                </div>
                <Input
                  label={`Maximum file size in MB (platform limit: ${filePolicy.hardMaxSizeMb}MB, default: ${filePolicy.defaultMaxSizeMb}MB)`}
                  type="number"
                  min={1}
                  max={filePolicy.hardMaxSizeMb}
                  value={form.maxFileSizeMb}
                  onChange={(e) => setForm({ ...form, maxFileSizeMb: e.target.value })}
                  placeholder={String(filePolicy.defaultMaxSizeMb)}
                />
              </>
            )}
          </div>
        )}
        <div className="flex gap-6">
          <Toggle checked={form.required} onChange={(v) => setForm({ ...form, required: v })} label="Required" />
          <Toggle checked={form.allowUnknown} onChange={(v) => setForm({ ...form, allowUnknown: v })} label={'Allow "I don\'t know"'} />
        </div>
        <div className="rounded-xl border border-gray-200 p-3 dark:border-[var(--border)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Show only if…</p>
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Depends on"
              value={form.dependsOnQuestionId}
              onChange={(e) => setForm({ ...form, dependsOnQuestionId: e.target.value })}
              options={[{ value: "", label: "Always show" }, ...existingQuestions.filter((q) => !editing || q._id !== editing._id).map((q) => ({ value: q._id, label: q.label }))]}
              className="w-auto"
            />
            {form.dependsOnQuestionId && (
              <>
                <Select label="Condition" value={form.dependsOnCondition} onChange={(e) => setForm({ ...form, dependsOnCondition: e.target.value })} options={[{ value: "equals", label: "equals" }, { value: "not_equals", label: "doesn't equal" }, { value: "in", label: "is one of" }]} className="w-auto" />
                <Input label="Value" value={form.dependsOnValue} onChange={(e) => setForm({ ...form, dependsOnValue: e.target.value })} />
              </>
            )}
          </div>
        </div>
        <Button onClick={save} loading={saving} disabled={!form.label || !fuelKey}>Save question</Button>
      </div>
    </Modal>
  );
}

// ==================== EQUIPMENT ====================

export function EquipmentTab({ chatbotId, showToast }) {
  const [fuels, setFuels] = useState([]);
  const [fuelKey, setFuelKey] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFuelKey, setImportFuelKey] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const loadFuels = async () => {
    try {
      const [fuelsRes, configRes] = await Promise.all([api.get(`/chatbots/${chatbotId}/energy/fuels`), api.get(`/chatbots/${chatbotId}/energy/config`)]);
      const enabled = fuelsRes.data.fuels.filter((f) => configRes.data.config.enabledFuelKeys.includes(f.key));
      setFuels(enabled);
      if (enabled.length > 0) setImportFuelKey(enabled[0].key);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  useEffect(() => {
    loadFuels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/equipment`, { params: { ...(fuelKey ? { fuelKey } : {}), ...(category ? { category } : {}), ...(search ? { search } : {}) } });
      setItems(res.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelKey, category, chatbotId]);

  const remove = async (itemId) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/energy/equipment/${itemId}`);
      showToast("Equipment deleted.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const runImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !importFuelKey) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fuelKey", importFuelKey);
      const res = await api.post(`/chatbots/${chatbotId}/energy/equipment/import`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showToast(`Imported ${res.data.importedCount} items.${res.data.duplicateWarnings?.length ? ` ${res.data.duplicateWarnings.length} possible duplicate(s) flagged.` : ""}`);
      setImportOpen(false);
      load();
    } catch (err) {
      setImportErrors(err?.response?.data?.errors || [getErrorMessage(err)]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Fuel" value={fuelKey} onChange={(e) => setFuelKey(e.target.value)} options={[{ value: "", label: "All fuels" }, ...fuels.map((f) => ({ value: f.key, label: f.label }))]} className="w-auto" />
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. panel" className="w-32" />
        <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Name, manufacturer, model…" />
        <Button variant="secondary" onClick={load}>Search</Button>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus className="h-4 w-4" /> Add equipment</Button>
        <Button variant="secondary" onClick={() => setImportOpen(true)}><FiUpload className="h-4 w-4" /> Import CSV</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <SkeletonLine className="h-32 w-full" />
      ) : items.length === 0 ? (
        <EmptyState title="No equipment yet" description="Add your products above, or import a CSV." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Fuel</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Manufacturer</th><th className="px-3 py-2">Capacity</th><th className="px-3 py-2">Price</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.fuelKey}</td>
                  <td className="px-3 py-2">{item.category}</td>
                  <td className="px-3 py-2">{item.manufacturer || "—"}</td>
                  <td className="px-3 py-2">{item.capacityValue ? `${item.capacityValue} ${item.capacityUnit}` : "—"}</td>
                  <td className="px-3 py-2">{item.price ? `${item.currency === "INR" ? "₹" : item.currency + " "}${Number(item.price).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(item); setModalOpen(true); }} className="mr-3 text-xs text-primary-500 hover:underline">Edit</button>
                    <button onClick={() => remove(item._id)} className="text-gray-400 hover:text-red-500"><FiTrash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EquipmentModal open={modalOpen} onClose={() => setModalOpen(false)} chatbotId={chatbotId} fuels={fuels} editing={editing} showToast={showToast} onSaved={() => { setModalOpen(false); load(); }} />

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import equipment from CSV">
        <div className="space-y-4 p-5">
          <Select label="Fuel" value={importFuelKey} onChange={(e) => setImportFuelKey(e.target.value)} options={fuels.map((f) => ({ value: f.key, label: f.label }))} />
          <p className="text-xs text-gray-500">Columns: name, category, manufacturer, modelNumber, description, capacityValue, capacityUnit, price, currency.</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="block w-full text-sm" />
          {importErrors.length > 0 && <div className="max-h-40 overflow-y-auto rounded-lg bg-danger-50 p-3 text-xs text-danger-600 dark:bg-red-950 dark:text-red-300">{importErrors.map((e, i) => <p key={i}>{e}</p>)}</div>}
          <Button onClick={runImport} loading={importing}>Import</Button>
        </div>
      </Modal>
    </div>
  );
}

export function EquipmentModal({ open, onClose, chatbotId, fuels, editing, showToast, onSaved }) {
  const empty = { name: "", fuelKey: fuels[0]?.key || "", category: "", manufacturer: "", modelNumber: "", description: "", capacityValue: "", capacityUnit: "", price: "", currency: "INR", specs: [] };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [datasheetFile, setDatasheetFile] = useState(null);

  useEffect(() => {
    if (editing) setForm({ ...empty, ...editing, specs: Object.entries(editing.specs || {}).map(([key, value]) => ({ key, value: String(value) })) });
    else setForm({ ...empty, fuelKey: fuels[0]?.key || "" });
    setImageFile(null);
    setDatasheetFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  const setSpec = (i, field, value) => setForm((f) => ({ ...f, specs: f.specs.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)) }));
  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: "", value: "" }] }));
  const removeSpec = (i) => setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacityValue: form.capacityValue === "" ? null : Number(form.capacityValue),
        price: form.price === "" ? null : Number(form.price),
        specs: Object.fromEntries(form.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value])),
      };
      let itemId = editing?._id;
      if (editing) await api.patch(`/chatbots/${chatbotId}/energy/equipment/${editing._id}`, payload);
      else {
        const res = await api.post(`/chatbots/${chatbotId}/energy/equipment`, payload);
        itemId = res.data.item._id;
        if (res.data.duplicateWarning) showToast(res.data.duplicateWarning, "error");
      }
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await api.post(`/chatbots/${chatbotId}/energy/equipment/${itemId}/image`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      if (datasheetFile) {
        const fd = new FormData();
        fd.append("file", datasheetFile);
        await api.post(`/chatbots/${chatbotId}/energy/equipment/${itemId}/datasheet`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      showToast(editing ? "Equipment updated." : "Equipment added.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit equipment" : "Add equipment"} wide>
      <div className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Fuel" value={form.fuelKey} onChange={(e) => setForm({ ...form, fuelKey: e.target.value })} options={fuels.map((f) => ({ value: f.key, label: f.label }))} disabled={Boolean(editing)} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. panel, inverter, compressor" />
          <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          <Input label="Model number" value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />
          <Input label="Availability" value={form.availability || "in_stock"} onChange={() => {}} disabled />
          <Input label="Capacity value" type="number" value={form.capacityValue} onChange={(e) => setForm({ ...form, capacityValue: e.target.value })} />
          <Input label="Capacity unit" value={form.capacityUnit} onChange={(e) => setForm({ ...form, capacityUnit: e.target.value })} placeholder="e.g. kW, bar, kg/day" />
          <Input label="Price (optional)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </div>
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Technical specs</p>
          {form.specs.map((s, i) => (
            <div key={i} className="mb-1.5 flex items-center gap-1.5">
              <input value={s.key} onChange={(e) => setSpec(i, "key", e.target.value)} placeholder="e.g. pressureBar" className="w-1/3 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]" />
              <input value={s.value} onChange={(e) => setSpec(i, "value", e.target.value)} placeholder="value" className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]" />
              <button onClick={() => removeSpec(i)} className="text-gray-400 hover:text-red-500"><FiTrash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button onClick={addSpec} className="flex items-center gap-1 text-xs text-primary-500 hover:underline"><FiPlus className="h-3 w-3" /> Add attribute</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Image</p>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Datasheet</p>
            <input type="file" onChange={(e) => setDatasheetFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
          </div>
        </div>

        <Button onClick={save} loading={saving} disabled={!form.name || !form.category || !form.fuelKey}>Save equipment</Button>
      </div>
    </Modal>
  );
}

// ==================== BOM & SOLUTIONS ====================

export function SolutionsTab({ chatbotId, showToast }) {
  const [fuels, setFuels] = useState([]);
  const [fuelKey, setFuelKey] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadFuels = async () => {
    try {
      const [fuelsRes, configRes] = await Promise.all([api.get(`/chatbots/${chatbotId}/energy/fuels`), api.get(`/chatbots/${chatbotId}/energy/config`)]);
      const enabled = fuelsRes.data.fuels.filter((f) => configRes.data.config.enabledFuelKeys.includes(f.key));
      setFuels(enabled);
      if (enabled.length > 0 && !fuelKey) setFuelKey(enabled[0].key);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  useEffect(() => {
    loadFuels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/solutions`, { params: fuelKey ? { fuelKey } : {} });
      setTemplates(res.data.templates);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelKey, chatbotId]);

  const act = async (templateId, action, body) => {
    try {
      await api.post(`/chatbots/${chatbotId}/energy/solutions/${templateId}/${action}`, body);
      showToast(`Template ${action.replace("_", " ")}d.`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const remove = async (templateId) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/energy/solutions/${templateId}`);
      showToast("Template deleted.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const submitReject = async () => {
    await act(rejectingId, "reject", { reason: rejectReason });
    setRejectingId(null);
    setRejectReason("");
  };

  if (fuels.length === 0) return <EmptyState title="No fuels enabled" description="Enable a fuel in the Fuels & Offerings tab first." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Fuel" value={fuelKey} onChange={(e) => setFuelKey(e.target.value)} options={fuels.map((f) => ({ value: f.key, label: f.label }))} className="w-auto" />
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus className="h-4 w-4" /> New template</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <SkeletonLine className="h-32 w-full" />
      ) : templates.length === 0 ? (
        <EmptyState title="No templates yet" description="Create a BOM/solution template for this fuel's project types." />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t._id} className="rounded-xl border border-gray-200 p-3 dark:border-[var(--border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.name} <span className="text-xs font-normal text-gray-400">v{t.version}</span></p>
                  <p className="text-xs text-gray-500">{t.outputTypes.map((o) => OUTPUT_TYPES.find((ot) => ot.value === o)?.label).join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span>
                  {!t.active && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400">inactive</span>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button onClick={() => { setEditing(t); setModalOpen(true); }} className="text-primary-500 hover:underline">Edit</button>
                <button onClick={() => setPreviewing(t)} className="text-primary-500 hover:underline">Preview</button>
                <button onClick={() => setHistoryFor(t)} className="flex items-center gap-1 text-gray-500 hover:underline"><FiClock className="h-3 w-3" /> Versions</button>
                {["draft", "rejected"].includes(t.status) && <button onClick={() => act(t._id, "submit")} className="text-primary-500 hover:underline">Submit for review</button>}
                {t.status === "pending_review" && (
                  <>
                    <button onClick={() => act(t._id, "approve")} className="text-emerald-600 hover:underline">Approve</button>
                    <button onClick={() => setRejectingId(t._id)} className="text-red-500 hover:underline">Reject</button>
                  </>
                )}
                {t.status !== "archived" && <button onClick={() => act(t._id, "archive")} className="text-gray-500 hover:underline">Archive</button>}
                {["draft", "rejected"].includes(t.status) && <button onClick={() => remove(t._id)} className="text-red-500 hover:underline">Delete</button>}
                {t.status === "approved" && (
                  <label className="flex items-center gap-1 text-gray-500">
                    <input type="checkbox" checked={t.active} onChange={(e) => api.patch(`/chatbots/${chatbotId}/energy/solutions/${t._id}/active`, { active: e.target.checked }).then(load)} />
                    Active
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SolutionModal open={modalOpen} onClose={() => setModalOpen(false)} chatbotId={chatbotId} fuelKey={fuelKey} fuels={fuels} editing={editing} showToast={showToast} onSaved={() => { setModalOpen(false); load(); }} />
      {previewing && <SolutionPreviewModal chatbotId={chatbotId} template={previewing} onClose={() => setPreviewing(null)} showToast={showToast} />}
      {historyFor && <VersionHistoryModal chatbotId={chatbotId} template={historyFor} onClose={() => setHistoryFor(null)} />}

      <Modal open={Boolean(rejectingId)} onClose={() => setRejectingId(null)} title="Reject template">
        <div className="space-y-3 p-5">
          <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="What needs to change?" />
          <Button onClick={submitReject}>Reject</Button>
        </div>
      </Modal>
    </div>
  );
}

export function SolutionModal({ open, onClose, chatbotId, fuelKey, fuels, editing, showToast, onSaved }) {
  const empty = { name: "", description: "", fuelKey: fuelKey, projectTypeId: "", outputTypes: [], requiredQuestionIds: [], optionalQuestionIds: [], equipmentMappings: [], requiresEngineeringReview: false };
  const [form, setForm] = useState(empty);
  const [projectTypes, setProjectTypes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);

  const effectiveFuelKey = editing?.fuelKey || form.fuelKey || fuelKey;

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({ ...empty, ...editing, fuelKey: editing.fuelKey });
    else setForm({ ...empty, fuelKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open, fuelKey]);

  useEffect(() => {
    if (!open || !effectiveFuelKey) return;
    Promise.all([
      api.get(`/chatbots/${chatbotId}/energy/project-types`, { params: { fuelKey: effectiveFuelKey } }),
      api.get(`/chatbots/${chatbotId}/energy/questions`, { params: { fuelKey: effectiveFuelKey } }),
      api.get(`/chatbots/${chatbotId}/energy/equipment`, { params: { fuelKey: effectiveFuelKey } }),
    ]).then(([pt, q, eq]) => {
      setProjectTypes(pt.data.items);
      setQuestions(q.data.questions);
      setEquipment(eq.data.items);
    });
  }, [open, effectiveFuelKey, chatbotId]);

  const toggleOutputType = (value) => setForm((f) => ({ ...f, outputTypes: f.outputTypes.includes(value) ? f.outputTypes.filter((v) => v !== value) : [...f.outputTypes, value] }));
  const toggleQuestion = (field, id) => setForm((f) => ({ ...f, [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id] }));

  const addMapping = () => setForm((f) => ({ ...f, equipmentMappings: [...f.equipmentMappings, { equipmentId: equipment[0]?._id || "", mandatory: true, quantityRule: { type: "fixed", fixedQty: 1 }, selectionCondition: null, notes: "" }] }));
  const updateMapping = (i, patch) => setForm((f) => ({ ...f, equipmentMappings: f.equipmentMappings.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));
  const removeMapping = (i) => setForm((f) => ({ ...f, equipmentMappings: f.equipmentMappings.filter((_, idx) => idx !== i) }));

  const allQuestionIds = [...form.requiredQuestionIds, ...form.optionalQuestionIds];

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, fuelKey: effectiveFuelKey };
      if (editing) {
        const res = await api.patch(`/chatbots/${chatbotId}/energy/solutions/${editing._id}`, payload);
        if (res.data.newVersionCreated) showToast("Approved template changed — a new draft version was created.");
        else showToast("Template updated.");
      } else {
        await api.post(`/chatbots/${chatbotId}/energy/solutions`, payload);
        showToast("Template created.");
      }
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit template" : "New BOM/solution template"} wide>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Fuel" value={effectiveFuelKey} onChange={(e) => setForm({ ...form, fuelKey: e.target.value, projectTypeId: "" })} options={fuels.map((f) => ({ value: f.key, label: f.label }))} disabled={Boolean(editing)} />
          <Select label="Project type" value={form.projectTypeId} onChange={(e) => setForm({ ...form, projectTypeId: e.target.value })} options={[{ value: "", label: "Select…" }, ...projectTypes.map((p) => ({ value: p._id, label: p.label }))]} disabled={Boolean(editing)} />
          <Toggle checked={form.requiresEngineeringReview} onChange={(v) => setForm({ ...form, requiresEngineeringReview: v })} label="Always needs engineering review" />
        </div>
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Output types</p>
          <div className="flex flex-wrap gap-3">
            {OUTPUT_TYPES.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.outputTypes.includes(o.value)} onChange={() => toggleOutputType(o.value)} className="rounded border-gray-300" /> {o.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Required questions</p>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {questions.map((q) => (
                <label key={q._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={form.requiredQuestionIds.includes(q._id)} onChange={() => toggleQuestion("requiredQuestionIds", q._id)} /> {q.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Optional questions</p>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
              {questions.map((q) => (
                <label key={q._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={form.optionalQuestionIds.includes(q._id)} onChange={() => toggleQuestion("optionalQuestionIds", q._id)} /> {q.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Equipment mappings</p>
            <button onClick={addMapping} className="flex items-center gap-1 text-xs text-primary-500 hover:underline"><FiPlus className="h-3 w-3" /> Add mapping</button>
          </div>
          <div className="space-y-2">
            {form.equipmentMappings.map((m, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-2.5 dark:border-[var(--border)]">
                <div className="flex flex-wrap items-center gap-2">
                  <select value={m.equipmentId} onChange={(e) => updateMapping(i, { equipmentId: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]">
                    {equipment.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <input type="checkbox" checked={m.mandatory} onChange={(e) => updateMapping(i, { mandatory: e.target.checked })} /> Mandatory
                  </label>
                  <select value={m.quantityRule.type} onChange={(e) => updateMapping(i, { quantityRule: { ...m.quantityRule, type: e.target.value } })} className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]">
                    <option value="fixed">Fixed qty</option>
                    <option value="per_question_value">Qty = answer × multiplier</option>
                    <option value="per_question_value_divided">Qty = answer ÷ divisor</option>
                  </select>
                  {m.quantityRule.type === "fixed" && (
                    <input type="number" value={m.quantityRule.fixedQty} onChange={(e) => updateMapping(i, { quantityRule: { ...m.quantityRule, fixedQty: Number(e.target.value) } })} className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]" />
                  )}
                  {m.quantityRule.type !== "fixed" && (
                    <>
                      <select value={m.quantityRule.sourceQuestionId || ""} onChange={(e) => updateMapping(i, { quantityRule: { ...m.quantityRule, sourceQuestionId: e.target.value } })} className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]">
                        <option value="">Question…</option>
                        {questions.filter((q) => allQuestionIds.includes(q._id)).map((q) => <option key={q._id} value={q._id}>{q.label}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder={m.quantityRule.type === "per_question_value" ? "multiplier" : "divisor"}
                        value={m.quantityRule.type === "per_question_value" ? m.quantityRule.multiplier : m.quantityRule.divisor}
                        onChange={(e) => updateMapping(i, { quantityRule: { ...m.quantityRule, [m.quantityRule.type === "per_question_value" ? "multiplier" : "divisor"]: Number(e.target.value) } })}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]"
                      />
                    </>
                  )}
                  <button onClick={() => removeMapping(i)} className="ml-auto text-gray-400 hover:text-red-500"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </div>
                <input value={m.notes} onChange={(e) => updateMapping(i, { notes: e.target.value })} placeholder="Notes / reason for selection" className="mt-1.5 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={save} loading={saving} disabled={!form.name || !form.projectTypeId || form.outputTypes.length === 0}>Save template</Button>
      </div>
    </Modal>
  );
}

export function SolutionPreviewModal({ chatbotId, template, onClose, showToast }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/chatbots/${chatbotId}/energy/questions`, { params: { fuelKey: template.fuelKey } }).then((res) => {
      const ids = new Set([...(template.requiredQuestionIds || []), ...(template.optionalQuestionIds || [])].map(String));
      setQuestions(res.data.questions.filter((q) => ids.has(q._id)));
    });
  }, [chatbotId, template]);

  const run = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/chatbots/${chatbotId}/energy/solutions/${template._id}/preview`, { answers });
      setResult(res.data.result);
      setWarning(res.data.previewWarning);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (kind) => {
    try {
      const token = localStorage.getItem("nuformly-token");
      const res = await fetch(`${api.defaults.baseURL}/chatbots/${chatbotId}/energy/solutions/${template._id}/preview/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name}-preview.${kind === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Export failed.", "error");
    }
  };

  return (
    <Modal open onClose={onClose} title={`Preview: ${template.name}`} wide>
      <div className="space-y-4 p-5">
        {warning && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{warning}</p>}
        <div className="grid grid-cols-2 gap-3">
          {questions.map((q) => (
            <Input key={q._id} label={q.label} value={answers[q._id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q._id]: q.type === "number" || q.type === "number_unit" ? Number(e.target.value) : e.target.value }))} />
          ))}
        </div>
        <Button onClick={run} loading={loading}>Run preview</Button>

        {result && !result.valid && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <p className="font-medium">Missing required information:</p>
            {result.missingInputs.map((m) => <p key={m.questionId}>• {m.label}</p>)}
          </div>
        )}
        {result && result.valid && (
          <div className="space-y-2">
            {result.lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm dark:border-[var(--border)]">
                <span>{l.name} {l.mandatory ? "" : "(optional)"} {l.requiresEngineeringReview && <span className="text-amber-600">⚠ review needed</span>}</span>
                <span>{l.qty ?? "—"} {l.unit}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => exportFile("pdf")}><FiDownload className="h-4 w-4" /> PDF</Button>
              <Button variant="secondary" onClick={() => exportFile("excel")}><FiDownload className="h-4 w-4" /> Excel</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function VersionHistoryModal({ chatbotId, template, onClose }) {
  const [versions, setVersions] = useState([]);
  useEffect(() => {
    api.get(`/chatbots/${chatbotId}/energy/solutions/${template._id}/versions`).then((res) => setVersions(res.data.versions));
  }, [chatbotId, template]);
  return (
    <Modal open onClose={onClose} title={`Version history: ${template.name}`}>
      <div className="space-y-2 p-5">
        {versions.map((v) => (
          <div key={v._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm dark:border-[var(--border)]">
            <span>v{v.version}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[v.status]}`}>{v.status.replace("_", " ")}</span>
            <span className="text-xs text-gray-400">{new Date(v.updatedAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ==================== SUPPLIERS ====================

export function SuppliersTab({ chatbotId, showToast }) {
  const [fuels, setFuels] = useState([]);
  const [fuelFilter, setFuelFilter] = useState("");
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      const [fuelsRes, configRes] = await Promise.all([api.get(`/chatbots/${chatbotId}/energy/fuels`), api.get(`/chatbots/${chatbotId}/energy/config`)]);
      setFuels(fuelsRes.data.fuels.filter((f) => configRes.data.config.enabledFuelKeys.includes(f.key)));
    })();
  }, [chatbotId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/suppliers`, { params: { ...(fuelFilter ? { fuelKey: fuelFilter } : {}), ...(search ? { search } : {}) } });
      setSuppliers(res.data.suppliers);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelFilter, chatbotId]);

  const remove = async (supplierId) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/energy/suppliers/${supplierId}`);
      showToast("Supplier deleted.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Fuel" value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)} options={[{ value: "", label: "All fuels" }, ...fuels.map((f) => ({ value: f.key, label: f.label }))]} className="w-auto" />
        <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Name, contact, email…" />
        <Button variant="secondary" onClick={load}>Search</Button>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus className="h-4 w-4" /> Add supplier</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <SkeletonLine className="h-32 w-full" />
      ) : suppliers.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Add suppliers so the engine can match equipment to a real source." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Fuels</th><th className="px-3 py-2">Equipment</th><th className="px-3 py-2">Lead time</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {suppliers.map((s) => (
                <tr key={s._id}>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{s.contactPerson || s.email || "—"}</td>
                  <td className="px-3 py-2 text-xs">{(s.supportedFuelKeys || []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-xs">{(s.equipmentIds || []).length} item(s)</td>
                  <td className="px-3 py-2 text-xs">{s.leadTimeDays ? `${s.leadTimeDays}d` : "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${s.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>{s.active ? "Active" : "Inactive"}</span>
                    {" "}
                    <span className="text-xs text-gray-400">{s.verificationStatus}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(s); setModalOpen(true); }} className="mr-3 text-xs text-primary-500 hover:underline">Edit</button>
                    <button onClick={() => remove(s._id)} className="text-gray-400 hover:text-red-500"><FiTrash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SupplierModal open={modalOpen} onClose={() => setModalOpen(false)} chatbotId={chatbotId} fuels={fuels} editing={editing} showToast={showToast} onSaved={() => { setModalOpen(false); load(); }} />
    </div>
  );
}

export function SupplierModal({ open, onClose, chatbotId, fuels, editing, showToast, onSaved }) {
  const empty = { name: "", contactPerson: "", email: "", phone: "", website: "", address: "", city: "", state: "", country: "", serviceRegions: "", supportedFuelKeys: [], supportedProjectTypeIds: [], equipmentIds: [], leadTimeDays: "", minOrderQty: "", active: true, verificationStatus: "unverified", verificationNotes: "" };
  const [form, setForm] = useState(empty);
  const [projectTypes, setProjectTypes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [docLabel, setDocLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({ ...empty, ...editing, serviceRegions: (editing.serviceRegions || []).join(", "), leadTimeDays: editing.leadTimeDays ?? "", minOrderQty: editing.minOrderQty ?? "" });
    else setForm(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  useEffect(() => {
    if (!open || form.supportedFuelKeys.length === 0) {
      setProjectTypes([]);
      setEquipment([]);
      return;
    }
    Promise.all(form.supportedFuelKeys.map((fuelKey) => Promise.all([api.get(`/chatbots/${chatbotId}/energy/project-types`, { params: { fuelKey } }), api.get(`/chatbots/${chatbotId}/energy/equipment`, { params: { fuelKey } })]))).then((results) => {
      setProjectTypes(results.flatMap(([pt]) => pt.data.items));
      setEquipment(results.flatMap(([, eq]) => eq.data.items));
    });
  }, [open, form.supportedFuelKeys, chatbotId]);

  const toggleFuel = (key) => setForm((f) => ({ ...f, supportedFuelKeys: f.supportedFuelKeys.includes(key) ? f.supportedFuelKeys.filter((k) => k !== key) : [...f.supportedFuelKeys, key] }));
  const toggleId = (field, id) => setForm((f) => ({ ...f, [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id] }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        serviceRegions: form.serviceRegions.split(",").map((s) => s.trim()).filter(Boolean),
        leadTimeDays: form.leadTimeDays === "" ? null : Number(form.leadTimeDays),
        minOrderQty: form.minOrderQty === "" ? null : Number(form.minOrderQty),
      };
      if (editing) await api.patch(`/chatbots/${chatbotId}/energy/suppliers/${editing._id}`, payload);
      else await api.post(`/chatbots/${chatbotId}/energy/suppliers`, payload);
      showToast(editing ? "Supplier updated." : "Supplier added.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", docLabel || file.name);
      await api.post(`/chatbots/${chatbotId}/energy/suppliers/${editing._id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Document uploaded.");
      setDocLabel("");
      if (fileRef.current) fileRef.current.value = "";
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit supplier" : "Add supplier"} wide>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Supplier/company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input label="Business email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input label="Service regions (comma-separated)" value={form.serviceRegions} onChange={(e) => setForm({ ...form, serviceRegions: e.target.value })} placeholder="Maharashtra, Pan India…" />
          <Input label="Lead time (days)" type="number" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
          <Input label="Minimum order quantity" type="number" value={form.minOrderQty} onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} />
          <Select label="Verification status" value={form.verificationStatus} onChange={(e) => setForm({ ...form, verificationStatus: e.target.value })} options={[{ value: "unverified", label: "Unverified" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }]} />
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
        </div>
        <Input label="Verification notes / supporting evidence" value={form.verificationNotes} onChange={(e) => setForm({ ...form, verificationNotes: e.target.value })} />

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Supported fuels</p>
          <div className="flex flex-wrap gap-2">
            {fuels.map((f) => (
              <button key={f.key} type="button" onClick={() => toggleFuel(f.key)} className={`rounded-full border px-3 py-1 text-xs ${form.supportedFuelKeys.includes(f.key) ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {form.supportedFuelKeys.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Equipment supplied</p>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
                {equipment.map((e) => (
                  <label key={e._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.equipmentIds.includes(e._id)} onChange={() => toggleId("equipmentIds", e._id)} /> {e.name} <span className="text-xs text-gray-400">({e.fuelKey})</span>
                  </label>
                ))}
                {equipment.length === 0 && <p className="text-xs text-gray-400">No equipment in this fuel yet.</p>}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Supported project types</p>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border)]">
                {projectTypes.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 py-0.5 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.supportedProjectTypeIds.includes(p._id)} onChange={() => toggleId("supportedProjectTypeIds", p._id)} /> {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Documents / certifications</p>
            <div className="mb-2 space-y-1">
              {(editing.documents || []).map((d) => (
                <div key={d._id} className="flex items-center justify-between text-xs">
                  <a href={`${api.defaults.baseURL}/chatbots/${chatbotId}/energy/suppliers/${editing._id}/documents/${d._id}`} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">{d.label || d.filename}</a>
                  <button
                    onClick={async () => { await api.delete(`/chatbots/${chatbotId}/energy/suppliers/${editing._id}/documents/${d._id}`); onSaved(); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={docLabel} onChange={(e) => setDocLabel(e.target.value)} placeholder="Label (e.g. ISO Certificate)" className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:bg-[var(--surface)] dark:border-[var(--border)]" />
              <input ref={fileRef} type="file" className="text-xs" />
              <Button variant="secondary" onClick={uploadDoc} loading={uploading}><FiUpload className="h-3.5 w-3.5" /> Upload</Button>
            </div>
          </div>
        )}

        <Button onClick={save} loading={saving} disabled={!form.name}>Save supplier</Button>
      </div>
    </Modal>
  );
}
