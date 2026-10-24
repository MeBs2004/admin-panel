import { useEffect, useState } from "react";
import { usePanel } from "../../../utils/panelPath.js";
import { FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import useEligibleCompanies from "../../../hooks/useEligibleCompanies.js";
import { STARTER_CHATBOT_CONFIG } from "../../../config/chatbotStarter.js";
import PageHeader from "../../../components/ui/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import WizardProgress from "./WizardProgress.jsx";
import StepTemplate from "./StepTemplate.jsx";
import StepBasics from "./StepBasics.jsx";
import StepAI from "./StepAI.jsx";
import StepKnowledge, { KNOWLEDGE_MAX_BYTES, knowledgeBytes } from "./StepKnowledge.jsx";
import StepCustomize from "./StepCustomize.jsx";
import StepReview from "./StepReview.jsx";

const ALL_STEP_ORDER = ["template", "basics", "ai", "knowledge", "customize", "review"];
const NAME_MAX = 100;

const DEFAULT_FORM = {
  companyId: "",
  name: "",
  template: "general",
  model: "openai/gpt-oss-20b",
  temperature: 0.3,
  language: "English",
  systemPrompt: "",
};

export default function CreateChatbotWizard() {
  const { navigate, path: panelPath, inCompanyPanel } = usePanel();
  // Companies don't pick the AI model or prompt — the platform manages
  // that — so the Company Panel skips the AI step (new chatbots keep the
  // company's existing AI settings).
  const STEP_ORDER = inCompanyPanel ? ALL_STEP_ORDER.filter((s) => s !== "ai") : ALL_STEP_ORDER;
  const { showToast } = useToast();
  const { companies, loading: companiesLoading } = useEligibleCompanies();

  const [step, setStep] = useState("template");
  const [form, setForm] = useState(DEFAULT_FORM);
  // Every new chatbot starts with the Nuform look and is customized from there.
  const [config, setConfig] = useState(STARTER_CHATBOT_CONFIG);
  // Knowledge typed or uploaded in the wizard; saved once the chatbot exists.
  // `original`/`updatedAt` are what was loaded, so an untouched base isn't rewritten.
  const [knowledge, setKnowledge] = useState({ content: "", original: "", updatedAt: null, loaded: false });
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

  const knowledgeTooBig = knowledge.loaded && knowledgeBytes(knowledge.content) > KNOWLEDGE_MAX_BYTES;

  const goNext = () => {
    if (step === "basics" && !validateBasics()) return;
    if (step === "knowledge" && knowledgeTooBig) return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  // Real backend persistence, in order — never just React state:
  //   1. create the chatbot row (name/company/model)
  //   2. persist the customization (same endpoint/schema ChatbotStudio
  //      uses) and flip it to the v1 config-driven engine — a chatbot
  //      created through this wizard has a genuinely live config from
  //      the first moment, not a legacy hardcoded shell
  //   3. persist AI settings through the real, already-working AI
  //      Settings endpoint (company-level — see StepAI's warning)
  // Steps 2/3 are best-effort: if either fails, the chatbot still
  // exists and is fully editable afterward from its own pages, so we
  // surface a warning rather than pretending the whole thing failed.
  const handleCreate = async () => {
    if (submitting) return;
    if (knowledgeTooBig) {
      setSubmitError("Your knowledge base is over 2 MB. Go back to Knowledge and shorten it.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const createRes = await api.post("/chatbots", {
        companyId: form.companyId,
        name: form.name.trim(),
        model: form.model.trim() || undefined,
        template: form.template,
      });
      const chatbot = createRes.data.chatbot;

      const warnings = [];

      try {
        await api.patch(`/chatbots/${chatbot._id}/config`, { config });
        await api.patch(`/chatbots/${chatbot._id}`, { widgetEngineVersion: "v1" });
      } catch (err) {
        warnings.push(`Customization: ${getErrorMessage(err)}`);
      }

      // AI settings are company-wide; only the platform wizard (which has
      // the AI step) writes them.
      if (!inCompanyPanel) {
        try {
          await api.put(`/chatbots/${chatbot._id}/ai-settings`, {
            ai: {
              model: form.model.trim() || undefined,
              temperature: form.temperature,
              language: form.language,
              systemPrompt: form.systemPrompt.trim() || undefined,
            },
          });
        } catch (err) {
          warnings.push(`AI settings: ${getErrorMessage(err)}`);
        }
      }

      if (knowledge.loaded && knowledge.content !== knowledge.original) {
        try {
          await api.put(`/chatbots/${chatbot._id}/knowledge`, {
            content: knowledge.content,
            ...(knowledge.updatedAt ? { expectedUpdatedAt: knowledge.updatedAt } : {}),
          });
        } catch (err) {
          warnings.push(`Knowledge base: ${getErrorMessage(err)}`);
        }
      }

      if (warnings.length > 0) {
        showToast(`Chatbot created, but some settings didn't save: ${warnings.join(" · ")}`, "error");
      } else {
        showToast("Chatbot created successfully.");
      }

      setCreated(chatbot);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    const COLORS = ["#10b981", "#6366f1", "#0ea5e9", "#f59e0b", "#f43f5e", "#8b5cf6"];
    return (
      <div className="relative mx-auto max-w-lg overflow-hidden py-16 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden="true">
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 97) % 100}%`,
                background: COLORS[i % COLORS.length],
                "--dx": `${((i % 7) - 3) * 22}px`,
                animationDelay: `${(i % 9) * 0.07}s`,
              }}
            />
          ))}
        </div>
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 opacity-20 animate-ring-pulse" />
          <span className="pop-in flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 text-white shadow-glow-lg">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="draw-check" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
        <h1 className="animate-fade-in-up text-2xl font-semibold text-gray-900 dark:text-gray-100">Your chatbot is ready 🎉</h1>
        <p className="mt-2 animate-fade-in-up text-sm text-gray-500 dark:text-gray-400">
          <strong>{created.name}</strong> has been created successfully.
        </p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/chatbots")}>
            All Chatbots
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/chatbots/${created._id}/customize`)}>
            Keep customizing
          </Button>
          <Button onClick={() => navigate(`/chatbots/${created._id}/install`)}>Get Install Snippet</Button>
        </div>
      </div>
    );
  }

  const isCustomizeStep = step === "customize";

  return (
    <div className={`mx-auto transition-[max-width] duration-500 ease-out ${isCustomizeStep ? "max-w-[1480px]" : step === "review" ? "max-w-5xl" : step === "knowledge" ? "max-w-3xl" : "max-w-2xl"}`}>
      <PageHeader
        title="Create your AI chatbot"
        breadcrumbs={[{ label: "Chatbots", to: panelPath("/chatbots") }, { label: "Create Chatbot" }]}
        action={
          <Button variant="ghost" onClick={() => navigate("/chatbots")}>
            <FiArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        }
      />

      <WizardProgress
        steps={STEP_ORDER}
        current={step}
        onStepClick={(key) => {
          if (!submitting) setStep(key);
        }}
      />

      <div className="panel-card rounded-2xl border border-gray-200 bg-white p-6 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)] animate-fade-in-up">
        <div key={step} className="section-in">
        {step === "template" && (
          <StepTemplate template={form.template} setTemplate={(template) => setForm((f) => ({ ...f, template }))} />
        )}
        {step === "basics" && (
          <StepBasics
            form={form}
            setForm={setForm}
            companies={companies}
            companiesLoading={companiesLoading}
            errors={errors}
          />
        )}
        {step === "ai" && <StepAI form={form} setForm={setForm} companyId={form.companyId} companyName={companyName} />}
        {step === "knowledge" && (
          <StepKnowledge companyId={form.companyId} companyName={companyName} knowledge={knowledge} setKnowledge={setKnowledge} />
        )}
        {step === "customize" && (
          <StepCustomize config={config} setConfig={setConfig} companyId={form.companyId} />
        )}
        {step === "review" && <StepReview form={form} companyName={companyName} config={config} knowledge={knowledge} showAI={!inCompanyPanel} />}
        </div>

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
              disabled={companies.length === 0 || (step === "knowledge" && knowledgeTooBig)}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
