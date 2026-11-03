import { useEffect, useState } from "react";
import { usePanel } from "../../../utils/panelPath.js";
import { FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import useEligibleCompanies from "../../../hooks/useEligibleCompanies.js";
import { starterConfigForTemplate } from "../../../config/chatbotSectorStarters.js";
import PageHeader from "../../../components/ui/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import WizardProgress from "./WizardProgress.jsx";
import StepTemplate from "./StepTemplate.jsx";
import StepBasics from "./StepBasics.jsx";
import StepAI from "./StepAI.jsx";
import StepKnowledge, { KNOWLEDGE_MAX_BYTES, knowledgeBytes } from "./StepKnowledge.jsx";
import StepEnergyFull from "./StepEnergyFull.jsx";
import StepEducationFull from "./StepEducationFull.jsx";
import StepMarketingFull from "./StepMarketingFull.jsx";
import StepCustomize from "./StepCustomize.jsx";
import StepReview from "./StepReview.jsx";

const ALL_STEP_ORDER = ["template", "basics", "ai", "knowledge", "energyConfig", "educationConfig", "marketingConfig", "customize", "review"];
const NAME_MAX = 100;

// Company.industry (chosen at sign-up — see backend/config/industries.js)
// deliberately maps onto the same four chatbot templates, so a new
// chatbot defaults to the sector its own company is already in.
// "Other" has no matching template, so it falls back to General.
const INDUSTRY_TO_TEMPLATE = {
  Energy: "energy",
  Education: "education",
  "Digital Marketing": "digital_marketing",
  General: "general",
};

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
  // company's existing AI settings). The Energy Configuration step only
  // ever shows up for the Energy template — every other template's flow
  // is completely unchanged (Template → Basics → Knowledge → Design → Review).
  const { showToast } = useToast();
  const { companies, loading: companiesLoading } = useEligibleCompanies();

  const [step, setStep] = useState("template");
  const [form, setForm] = useState(DEFAULT_FORM);
  const STEP_ORDER = ALL_STEP_ORDER.filter(
    (s) =>
      (s === "ai" ? !inCompanyPanel : true) &&
      (s === "energyConfig" ? form.template === "energy" : true) &&
      (s === "educationConfig" ? form.template === "education" : true) &&
      (s === "marketingConfig" ? form.template === "digital_marketing" : true)
  );
  // The real chatbot row, created right after "basics" (see goNext) so
  // every later step — Energy Configuration above all — can operate on
  // a real chatbotId instead of deferred local state. Null until then.
  const [chatbotId, setChatbotId] = useState(null);
  const [creatingChatbot, setCreatingChatbot] = useState(false);
  // Once the admin picks a template themselves, their choice always wins —
  // this only ever supplies the initial default.
  const [templateTouched, setTemplateTouched] = useState(false);
  // Every new chatbot starts with a look matching its sector template
  // (see chatbotSectorStarters.js) — Nuform's own look for "general" — and
  // is customized from there.
  const [config, setConfig] = useState(() => starterConfigForTemplate(DEFAULT_FORM.template));
  // Knowledge typed or uploaded in the wizard; saved once the chatbot exists.
  // `original`/`updatedAt` are what was loaded, so an untouched base isn't rewritten.
  const [knowledge, setKnowledge] = useState({ content: "", original: "", updatedAt: null, loaded: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState(null);

  // Picking a different template (while still on that first step) loads
  // that sector's starter look into Customize/Review. Once the admin has
  // moved on and started customizing, changing their mind back on Template
  // never overwrites what they've already done.
  useEffect(() => {
    if (step === "template") setConfig(starterConfigForTemplate(form.template));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.template]);

  useEffect(() => {
    if (!companiesLoading && companies.length && !form.companyId) {
      setForm((f) => ({ ...f, companyId: companies[0].companyId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesLoading, companies]);

  // Defaults the template to the selected company's own industry —
  // still shows and allows all four templates, this only picks the
  // starting selection (see INDUSTRY_TO_TEMPLATE above).
  useEffect(() => {
    if (templateTouched || !form.companyId) return;
    const company = companies.find((c) => c.companyId === form.companyId);
    const mapped = company && INDUSTRY_TO_TEMPLATE[company.industry];
    if (mapped) setForm((f) => ({ ...f, template: mapped }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.companyId, companies, templateTouched]);

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

  // The chatbot row is created right after "basics" (not at the end of
  // the wizard) so every later step — Energy Configuration above all —
  // can configure the real thing instead of local-only draft state.
  // Guarded so going back to "basics" and forward again never creates
  // a second chatbot.
  const createChatbotNow = async () => {
    if (chatbotId || creatingChatbot) return chatbotId;
    setCreatingChatbot(true);
    setSubmitError("");
    try {
      const createRes = await api.post("/chatbots", {
        companyId: form.companyId,
        name: form.name.trim(),
        model: form.model.trim() || undefined,
        template: form.template,
      });
      const chatbot = createRes.data.chatbot;
      setChatbotId(chatbot._id);
      return chatbot._id;
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      return null;
    } finally {
      setCreatingChatbot(false);
    }
  };

  const goNext = async () => {
    if (step === "basics") {
      if (!validateBasics()) return;
      const id = await createChatbotNow();
      if (!id) return;
    }
    if (step === "knowledge" && knowledgeTooBig) return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  // By the "review" step the chatbot already exists (created right
  // after "basics") — this just finishes persisting the remaining
  // local-state steps (customize, AI settings, knowledge) against it.
  // Each is best-effort: if one fails, the chatbot still exists and is
  // fully editable afterward from its own pages, so we surface a
  // warning rather than pretending the whole thing failed.
  const handleFinish = async () => {
    if (submitting || !chatbotId) return;
    if (knowledgeTooBig) {
      setSubmitError("Your knowledge base is over 2 MB. Go back to Knowledge and shorten it.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const warnings = [];

      try {
        await api.patch(`/chatbots/${chatbotId}/config`, { config });
        await api.patch(`/chatbots/${chatbotId}`, { widgetEngineVersion: "v1" });
      } catch (err) {
        warnings.push(`Customization: ${getErrorMessage(err)}`);
      }

      // AI settings are company-wide; only the platform wizard (which has
      // the AI step) writes them.
      if (!inCompanyPanel) {
        try {
          await api.put(`/chatbots/${chatbotId}/ai-settings`, {
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
          await api.put(`/chatbots/${chatbotId}/knowledge`, {
            content: knowledge.content,
            ...(knowledge.updatedAt ? { expectedUpdatedAt: knowledge.updatedAt } : {}),
          });
        } catch (err) {
          warnings.push(`Knowledge base: ${getErrorMessage(err)}`);
        }
      }

      if (warnings.length > 0) {
        showToast(`Chatbot finished, but some settings didn't save: ${warnings.join(" · ")}`, "error");
      } else {
        showToast("Chatbot created successfully.");
      }

      const { data } = await api.get(`/chatbots/${chatbotId}`);
      setCreated(data.chatbot);
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
          <StepTemplate
            template={form.template}
            setTemplate={(template) => {
              setTemplateTouched(true);
              setForm((f) => ({ ...f, template }));
            }}
          />
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
        {step === "energyConfig" && <StepEnergyFull chatbotId={chatbotId} />}
        {step === "educationConfig" && <StepEducationFull chatbotId={chatbotId} />}
        {step === "marketingConfig" && <StepMarketingFull chatbotId={chatbotId} />}
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
            disabled={step === STEP_ORDER[0] || submitting}
          >
            Back
          </Button>

          {step === "review" ? (
            <Button onClick={handleFinish} loading={submitting}>
              {submitting ? "Finishing up..." : "Finish"}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              loading={step === "basics" && creatingChatbot}
              disabled={companies.length === 0 || (step === "knowledge" && knowledgeTooBig)}
            >
              {step === "basics" && creatingChatbot ? "Creating chatbot..." : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
