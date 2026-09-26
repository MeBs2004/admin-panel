import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import useEligibleCompanies from "../../../hooks/useEligibleCompanies.js";
import PageHeader from "../../../components/ui/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import WizardProgress from "./WizardProgress.jsx";
import StepBasics from "./StepBasics.jsx";
import StepAI from "./StepAI.jsx";
import StepKnowledge from "./StepKnowledge.jsx";
import StepReview from "./StepReview.jsx";

const STEP_ORDER = ["basics", "ai", "knowledge", "review"];
const NAME_MAX = 100;

const DEFAULT_FORM = {
  companyId: "",
  name: "",
  model: "openai/gpt-oss-20b",
  temperature: 0.3,
  language: "English",
  systemPrompt: "",
};

export default function CreateChatbotWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { companies, loading: companiesLoading } = useEligibleCompanies();

  const [step, setStep] = useState("basics");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!companiesLoading && companies.length && !form.companyId) {
      setForm((f) => ({ ...f, companyId: companies[0].companyId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesLoading, companies]);

  const companyName =
    companies.find((c) => c.companyId === form.companyId)?.name || "";

  const validateBasics = () => {
    const next = {};
    if (!form.companyId) next.company = "Select a company.";
    if (!form.name.trim()) next.name = "Chatbot name is required.";
    else if (form.name.trim().length > NAME_MAX)
      next.name = `Chatbot name must be less than ${NAME_MAX} characters.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === "basics" && !validateBasics()) return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleCreate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await api.post("/chatbots", {
        companyId: form.companyId,
        name: form.name.trim(),
        model: form.model.trim() || undefined,
        settings: {
          temperature: form.temperature,
          language: form.language,
          systemPrompt: form.systemPrompt.trim() || undefined,
        },
      });
      setCreated(res.data.chatbot);
      showToast("Chatbot created successfully.");
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 animate-scale-in items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10">
          <FiCheckCircle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Your chatbot is ready
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <strong>{created.name}</strong> has been created successfully.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/chatbots")}>
            All Chatbots
          </Button>
          <Button onClick={() => navigate(`/chatbots/${created._id}`)}>
            Open Chatbot
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create your AI chatbot"
        breadcrumbs={[{ label: "Chatbots", to: "/chatbots" }, { label: "Create Chatbot" }]}
        action={
          <Button variant="ghost" onClick={() => navigate("/chatbots")}>
            <FiArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        }
      />

      <WizardProgress current={step} />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {step === "basics" && (
          <StepBasics
            form={form}
            setForm={setForm}
            companies={companies}
            companiesLoading={companiesLoading}
            errors={errors}
          />
        )}
        {step === "ai" && <StepAI form={form} setForm={setForm} />}
        {step === "knowledge" && (
          <StepKnowledge companyId={form.companyId} companyName={companyName} />
        )}
        {step === "review" && <StepReview form={form} companyName={companyName} />}

        {submitError && (
          <p className="mt-4 animate-fade-in-up rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-[var(--border)]">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={step === "basics" || submitting}
          >
            Back
          </Button>

          {step === "review" ? (
            <Button onClick={handleCreate} loading={submitting}>
              {submitting ? "Creating your chatbot..." : "Create Chatbot"}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={companies.length === 0}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
