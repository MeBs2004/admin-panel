import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiTrash2, FiUserCheck, FiDollarSign, FiHome, FiBriefcase, FiAward, FiBookOpen, FiHelpCircle } from "react-icons/fi";
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

// Mirrors backend/services/education/educationDefaults.service.js's
// CATEGORY_DEFAULTS icon field — named imports only.
export const CATEGORY_ICONS = { FiUserCheck, FiDollarSign, FiHome, FiBriefcase, FiAward, FiBookOpen, FiHelpCircle };

const STATUS_COLORS = { new: "bg-blue-50 text-blue-700", contacted: "bg-amber-50 text-amber-700", converted: "bg-emerald-50 text-emerald-700", closed: "bg-gray-100 text-gray-500" };

export default function EducationConfiguration() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [tab, setTab] = useState("faqs");

  return (
    <div>
      <PageHeader title="Education Configuration" description="Categories & FAQs, courses, and the leads your chatbot captures." />
      <div className="animate-fade-in-up panel-card rounded-2xl border border-gray-200 bg-white shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs tabs={[{ value: "faqs", label: "Categories & FAQs" }, { value: "courses", label: "Courses & Programs" }, { value: "leads", label: "Leads" }]} active={tab} onChange={setTab} />
        <div className="p-5">
          {tab === "faqs" && <CategoriesFaqsTab chatbotId={id} showToast={showToast} />}
          {tab === "courses" && <CoursesTab chatbotId={id} showToast={showToast} />}
          {tab === "leads" && <LeadsTab chatbotId={id} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ==================== CATEGORIES & FAQS ====================

export function CategoriesFaqsTab({ chatbotId, showToast }) {
  const [categories, setCategories] = useState([]);
  const [categoryKey, setCategoryKey] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  const loadCategories = async () => {
    try {
      const res = await api.get(`/chatbots/${chatbotId}/education/categories`);
      setCategories(res.data.categories);
      if (res.data.categories.length > 0 && !categoryKey) setCategoryKey(res.data.categories[0].key);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId]);

  const loadFaqs = async () => {
    if (!categoryKey) {
      setFaqs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/education/faqs`, { params: { categoryKey } });
      setFaqs(res.data.faqs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);

  const toggleCategory = async (category) => {
    try {
      const enabledKeys = category.enabled ? categories.filter((c) => c.enabled && c.key !== category.key).map((c) => c.key) : [...categories.filter((c) => c.enabled).map((c) => c.key), category.key];
      await api.put(`/chatbots/${chatbotId}/education/config`, { enabledCategoryKeys: enabledKeys });
      setCategories((prev) => prev.map((c) => (c.key === category.key ? { ...c, enabled: !c.enabled } : c)));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const addCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    try {
      await api.post(`/chatbots/${chatbotId}/education/categories`, { label: newCategoryLabel.trim() });
      setNewCategoryLabel("");
      showToast("Category added.");
      loadCategories();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const toggleFaq = async (faq) => {
    try {
      const currentEnabled = faqs.filter((f) => f.enabled).map((f) => f._id);
      const next = faq.enabled ? currentEnabled.filter((id) => id !== faq._id) : [...currentEnabled, faq._id];
      // Merge with FAQs enabled under OTHER categories (not loaded here) by reading current config first.
      const configRes = await api.get(`/chatbots/${chatbotId}/education/config`);
      const others = (configRes.data.config.enabledFAQIds || []).filter((id) => !faqs.some((f) => f._id === id));
      await api.put(`/chatbots/${chatbotId}/education/config`, { enabledFAQIds: [...others, ...next] });
      setFaqs((prev) => prev.map((f) => (f._id === faq._id ? { ...f, enabled: !f.enabled } : f)));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const deleteFaq = async (faqId) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/education/faqs/${faqId}`);
      showToast("FAQ deleted.");
      loadFaqs();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (error) return <ErrorState message={error} onRetry={loadCategories} />;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Categories your chatbot shows</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon] || FiHelpCircle;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => { setCategoryKey(c.key); toggleCategory(c); }}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-all ${
                  c.enabled ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-200" : "border-gray-200 text-gray-600 hover:border-blue-300 dark:border-[var(--border)] dark:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" /> {c.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <Input label="Add a custom category" value={newCategoryLabel} onChange={(e) => setNewCategoryLabel(e.target.value)} placeholder="e.g. Exchange Programs" />
          <Button variant="secondary" onClick={addCategory}><FiPlus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 dark:border-[var(--border)]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <Select label="Category" value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} options={categories.map((c) => ({ value: c.key, label: c.label }))} className="w-auto" />
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus className="h-4 w-4" /> Add FAQ</Button>
        </div>

        {loading ? (
          <SkeletonLine className="h-32 w-full" />
        ) : faqs.length === 0 ? (
          <EmptyState title="No FAQs in this category yet" description="Add the questions visitors ask most, and the exact answer your chatbot should give — never left to the AI to guess." />
        ) : (
          <div className="space-y-2">
            {faqs.map((f) => (
              <div key={f._id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-[var(--border)]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{f.question}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{f.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Toggle checked={f.enabled} onChange={() => toggleFaq(f)} />
                  {f.isCustom && (
                    <button onClick={() => deleteFaq(f._id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FaqModal open={modalOpen} onClose={() => setModalOpen(false)} chatbotId={chatbotId} categoryKey={categoryKey} categories={categories} showToast={showToast} onSaved={loadFaqs} />
    </div>
  );
}

function FaqModal({ open, onClose, chatbotId, categoryKey, categories, showToast, onSaved }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [targetCategory, setTargetCategory] = useState(categoryKey);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion("");
      setAnswer("");
      setTargetCategory(categoryKey);
    }
  }, [open, categoryKey]);

  const save = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await api.post(`/chatbots/${chatbotId}/education/faqs`, { categoryKey: targetCategory, question: question.trim(), answer: answer.trim() });
      showToast("FAQ added.");
      onSaved();
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add an FAQ" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="space-y-3">
        <Select label="Category" value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} options={categories.map((c) => ({ value: c.key, label: c.label }))} />
        <Input label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What are the hostel facilities like?" />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="The exact answer your chatbot gives, verbatim — this is never left to the AI to improvise."
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
          />
        </div>
      </div>
    </Modal>
  );
}

// ==================== COURSES & PROGRAMS ====================

export function CoursesTab({ chatbotId, showToast }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/chatbots/${chatbotId}/education/courses`);
      setCourses(res.data.courses);
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

  const toggleCourse = async (course) => {
    try {
      const configRes = await api.get(`/chatbots/${chatbotId}/education/config`);
      const currentEnabled = configRes.data.config.enabledCourseIds || [];
      const next = course.enabled ? currentEnabled.filter((id) => id !== course._id) : [...currentEnabled, course._id];
      await api.put(`/chatbots/${chatbotId}/education/config`, { enabledCourseIds: next });
      setCourses((prev) => prev.map((c) => (c._id === course._id ? { ...c, enabled: !c.enabled } : c)));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await api.delete(`/chatbots/${chatbotId}/education/courses/${courseId}`);
      showToast("Course deleted.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><FiPlus className="h-4 w-4" /> Add course/program</Button>
      </div>
      {loading ? (
        <SkeletonLine className="h-32 w-full" />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Add the courses or programs your chatbot should be able to tell visitors about." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c._id} className="rounded-xl border border-gray-200 p-4 dark:border-[var(--border)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.name}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <Toggle checked={c.enabled} onChange={() => toggleCourse(c)} />
                  {c.isCustom && (
                    <button onClick={() => deleteCourse(c._id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {c.duration && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Duration: {c.duration}</p>}
              {c.feeRange && <p className="text-xs text-gray-500 dark:text-gray-400">Fees: {c.feeRange}</p>}
              {c.eligibility && <p className="text-xs text-gray-500 dark:text-gray-400">Eligibility: {c.eligibility}</p>}
            </div>
          ))}
        </div>
      )}
      <CourseModal open={modalOpen} onClose={() => setModalOpen(false)} chatbotId={chatbotId} showToast={showToast} onSaved={load} />
    </div>
  );
}

function CourseModal({ open, onClose, chatbotId, showToast, onSaved }) {
  const [form, setForm] = useState({ name: "", duration: "", feeRange: "", eligibility: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: "", duration: "", feeRange: "", eligibility: "", description: "" });
  }, [open]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/chatbots/${chatbotId}/education/courses`, form);
      showToast("Course added.");
      onSaved();
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a course/program" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="space-y-3">
        <Input label="Course/program name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. B.Tech Computer Science" />
        <Input label="Duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 4 years" />
        <Input label="Fee range" value={form.feeRange} onChange={(e) => setForm((f) => ({ ...f, feeRange: e.target.value }))} placeholder="e.g. ₹1.2L - ₹1.8L / year" />
        <Input label="Eligibility" value={form.eligibility} onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value }))} placeholder="e.g. 10+2 with PCM, 60%+" />
      </div>
    </Modal>
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
      const res = await api.get(`/chatbots/${chatbotId}/education/leads`, { params: status ? { status } : {} });
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
      await api.patch(`/chatbots/${chatbotId}/education/leads/${leadId}/status`, { status: newStatus });
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
        <EmptyState title="No leads yet" description={'When a visitor uses the "Get Free Counselling" option in your chatbot, their details show up here.'} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Interested in</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[var(--border)]">
              {leads.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-2.5 font-mono text-xs">{l.referenceId}</td>
                  <td className="px-4 py-2.5">{l.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.phone || l.email}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.courseInterest || "—"}</td>
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
