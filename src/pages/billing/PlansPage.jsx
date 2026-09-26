import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import BillingTabs from "./BillingTabs.jsx";
import BillingCompanyPicker from "../developer/DeveloperCompanyPicker.jsx";
import { useBillingCompany } from "./useBillingCompany.js";

const FEATURE_LABELS = {
  custom_branding: "Custom branding",
  advanced_analytics: "Advanced analytics",
  human_handoff: "Human handoff",
  developer_api: "Developer API",
  developer_webhooks: "Developer webhooks",
  knowledge_base: "Knowledge base",
  bot_builder: "Bot builder",
  advanced_channels: "Advanced channels",
};

const LIMIT_LABELS = {
  maxChatbots: "Chatbots",
  maxMembers: "Team members",
  maxMonthlyVisitors: "Monthly visitors",
  maxMonthlyConversations: "Monthly conversations",
  maxAIRequests: "Monthly AI requests",
  maxAPIKeys: "API keys",
  maxDeveloperWebhooks: "Developer webhooks",
};

function formatPrice(plan) {
  if (plan.monthlyPrice === 0) return "Free";
  if (plan.monthlyPrice === null) return "Contact Sales";
  return `${plan.currency} ${plan.monthlyPrice.toLocaleString()}/mo`;
}

export default function PlansPage() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useBillingCompany();
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const canChangePlan = can(me?.role, PERMISSIONS.BILLING_CHANGE_PLAN);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/billing/plans", { params: { companyId } })
      .then((res) => {
        setPlans(res.data.plans);
        setCurrentPlanId(res.data.currentPlanId);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  const changePlan = async (planId) => {
    setBusy(true);
    try {
      const res = await api.post("/billing/plan/change", { companyId, planId });
      showToast(res.data.message || "Plan changed.");
      load();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === "PAYMENT_PROVIDER_NOT_CONFIGURED") {
        showToast(data.message, "error");
      } else {
        showToast(getErrorMessage(err), "error");
      }
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Choose the plan that fits your usage."
        action={<BillingCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <BillingTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-64 w-full" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const canSwitchHere = plan.monthlyPrice === 0;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border p-5 ${
                  isCurrent
                    ? "border-primary-400 bg-primary-50/30 dark:bg-primary-500/5"
                    : "border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]"
                }`}
              >
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{plan.name}</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{formatPrice(plan)}</p>

                <ul className="mt-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  {Object.entries(plan.limits).map(([key, value]) => (
                    <li key={key}>
                      {LIMIT_LABELS[key] || key}: {value === null || value === "Infinity" || !Number.isFinite(value) ? "Unlimited" : value.toLocaleString()}
                    </li>
                  ))}
                </ul>

                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  {Object.entries(plan.features)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => (
                      <li key={key} className="flex items-center gap-1.5">
                        <FiCheck className="h-3 w-3 text-success-500" /> {FEATURE_LABELS[key] || key}
                      </li>
                    ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <Button variant="secondary" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : canChangePlan && canSwitchHere ? (
                    <Button
                      className="w-full"
                      onClick={() =>
                        setConfirm({
                          title: `Switch to ${plan.name}?`,
                          message: `This company will move to the ${plan.name} plan immediately.`,
                          action: () => changePlan(plan.id),
                        })
                      }
                    >
                      Switch to {plan.name}
                    </Button>
                  ) : canChangePlan ? (
                    <Button variant="secondary" className="w-full" onClick={() => changePlan(plan.id)}>
                      Contact Sales
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled className="w-full">
                      {plan.monthlyPrice === null ? "Contact Sales" : "Unavailable"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
