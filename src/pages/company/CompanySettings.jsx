import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

// Company-level profile fields only (name/logo/website/contact) —
// deliberately separate from chatbot customization (that lives under
// My Chatbots -> Customize Studio) and from the admin's own personal
// account (that's /company/account, reusing the existing Settings
// page unchanged). Saves through the exact same PATCH /companies/:id
// endpoint the Super Admin's Company Detail page already uses.
export default function CompanySettings() {
  const { showToast } = useToast();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/companies", { params: { limit: 1 } })
      .then((res) => {
        const mine = res.data.companies?.[0];
        if (!mine) {
          setError("No company found on this account.");
          return;
        }
        setCompany(mine);
        setForm({
          name: mine.name || "",
          website: mine.website || "",
          logo: mine.branding?.logo || "",
          email: mine.contact?.email || "",
          phone: mine.contact?.phone || "",
          address: mine.contact?.address || "",
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    setSaveError("");
    if (!form.name.trim()) return setSaveError("Company name is required.");

    setSaving(true);
    try {
      const res = await api.patch(`/companies/${company.companyId}`, {
        name: form.name.trim(),
        website: form.website.trim(),
        branding: { ...(company.branding || {}), logo: form.logo.trim() },
        contact: { ...(company.contact || {}), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() },
      });
      setCompany(res.data.company);
      showToast("Company profile updated.");
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!company || !form) return null;

  return (
    <div>
      <PageHeader title="Company Settings" description="Your company's profile and contact details." />

      <div className="max-w-lg panel-card rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)] animate-fade-in-up">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300">
            <FiBriefcase className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Company Profile</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Company ID: {company.companyId}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://acme.com" />
          <Input label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." />
          <Input label="Contact email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contact phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          {saveError && (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">{saveError}</p>
          )}

          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Looking for your own profile or password?{" "}
        <Link to="/company/account" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
          My Account
        </Link>
      </p>
    </div>
  );
}
