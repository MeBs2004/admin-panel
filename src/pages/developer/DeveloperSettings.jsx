import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";
import DeveloperCompanyPicker from "./DeveloperCompanyPicker.jsx";
import { useDeveloperCompany } from "./useDeveloperCompany.js";

export default function DeveloperSettings() {
  const { showToast } = useToast();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useDeveloperCompany();

  const [rateLimit, setRateLimit] = useState(100);
  const [apiVersion, setApiVersion] = useState("v1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/developer/settings", { params: { companyId } })
      .then((res) => {
        setRateLimit(res.data.settings?.rateLimitPerMinute ?? 100);
        setApiVersion(res.data.apiVersion);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/developer/settings", { companyId, rateLimitPerMinute: Number(rateLimit) });
      showToast("Developer settings saved.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Developer Settings"
        description="Platform-level configuration for this company's Developer API."
        action={<DeveloperCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <DeveloperTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-32 w-full max-w-xl" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && companyId && (
        <div className="max-w-xl space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <div>
            <Input
              label="Rate limit (requests per minute, per API key)"
              type="number"
              min={10}
              max={1000}
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Enforced in-memory by this server process (10–1000). In a multi-instance deployment each instance
              enforces its own window independently — see the API documentation's Rate Limits section.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-gray-500 dark:text-gray-400">API version</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{apiVersion}</span>
          </div>

          <Button onClick={save} loading={saving}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
