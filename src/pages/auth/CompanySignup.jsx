import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiBriefcase, FiArrowLeft, FiZap, FiBookOpen, FiTrendingUp, FiCpu, FiDollarSign, FiHeart, FiShoppingBag, FiGrid, FiCheck } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { INDUSTRY_OPTIONS } from "../../config/companyProfileOptions.js";
import { checkName, checkCompanyName, checkEmail, checkPassword, normalizeEmail, tidy, LIMITS } from "../../config/accountRules.js";
import AuthLayout, { AssistantPreview } from "./AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EmailSuggestion, suggestEmail, useTouched } from "./fields.jsx";

const INDUSTRY_ICONS = {
  Energy: FiZap,
  Education: FiBookOpen,
  "Digital Marketing": FiTrendingUp,
  Technology: FiCpu,
  Finance: FiDollarSign,
  Healthcare: FiHeart,
  "E-commerce": FiShoppingBag,
  Other: FiGrid,
};

const STEP_FIELDS = { 1: ["companyName", "industry"], 2: ["adminName", "email", "password"] };
const FIELD_STEP = { companyName: 1, industry: 1, adminName: 2, email: 2, password: 2 };
const EMPTY = { companyName: "", industry: "", adminName: "", email: "", password: "" };

// Everything but the password survives a refresh (this tab only).
const DRAFT = "nuformly-signup-draft";
const loadDraft = () => {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(DRAFT) || "{}"), password: "" };
  } catch {
    return EMPTY;
  }
};

/**
 * Company sign-up (/company/signup) in two short steps:
 *   1. your business — company name, industry
 *   2. your account — name, work email, password
 * The preview on the left builds the assistant from what's typed.
 */
export default function CompanySignup() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(loadDraft);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("fwd");
  const { touched, touch, touchAll } = useTouched();
  const [serverErrors, setServerErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const refs = { companyName: useRef(null), industry: useRef(null), adminName: useRef(null), email: useRef(null), password: useRef(null) };
  // set while this page is signing someone up, so the new session doesn't
  // bounce them past the "all set" screen
  const creating = useRef(false);

  useEffect(() => {
    try {
      const { password: _omit, ...rest } = form;
      sessionStorage.setItem(DRAFT, JSON.stringify(rest));
    } catch {
      /* private mode */
    }
  }, [form]);

  useEffect(() => {
    refs[step === 1 ? "companyName" : "adminName"].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate("/company/overview", { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [done, navigate]);

  if (user && user.role !== "SUPER_ADMIN" && !done && !creating.current) return <Navigate to="/company/overview" replace />;

  const ctx = { email: form.email, name: form.adminName, company: form.companyName };
  const errors = {
    companyName: checkCompanyName(form.companyName),
    industry: form.industry ? "" : "Pick the closest match — you can change it later.",
    adminName: checkName(form.adminName),
    email: checkEmail(form.email, { forSignup: true }),
    password: checkPassword(form.password, ctx),
  };
  // A field's own problem first; then anything the server said about it.
  const errorOf = (k) => (touched[k] ? errors[k] || serverErrors[k] || "" : serverErrors[k] || "");
  const set = (k) => (e) => {
    const v = typeof e === "string" ? e : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (serverErrors[k]) setServerErrors((s) => ({ ...s, [k]: "" }));
  };
  const suggestion = !errors.email && suggestEmail(normalizeEmail(form.email));
  const firstName = tidy(form.adminName).split(" ")[0];

  const firstInvalid = (keys) => keys.find((k) => errors[k] || serverErrors[k]);

  const goStep2 = (e) => {
    e.preventDefault();
    touchAll(STEP_FIELDS[1]);
    const bad = firstInvalid(STEP_FIELDS[1]);
    if (bad) return refs[bad].current?.focus();
    setFailure("");
    setDir("fwd");
    setStep(2);
  };

  const back = () => {
    setDir("back");
    setStep(1);
    setFailure("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    touchAll(STEP_FIELDS[2]);
    const bad = firstInvalid(STEP_FIELDS[2]);
    if (bad) return refs[bad].current?.focus();
    setFailure("");
    setLoading(true);
    creating.current = true;
    const result = await register({
      companyName: tidy(form.companyName),
      industry: form.industry,
      adminName: tidy(form.adminName),
      email: normalizeEmail(form.email),
      password: form.password,
      confirmPassword: form.password,
    });
    setLoading(false);
    if (!result.success) {
      creating.current = false;
      if (result.offline) {
        setFailure("Can't reach Nuformly right now. Check your internet connection and try again.");
      } else if (result.status === 429) {
        setFailure("Too many sign-up attempts from this network. Please wait a few minutes and try again.");
      } else if (result.field && FIELD_STEP[result.field]) {
        // Point at the exact field the server objected to.
        setServerErrors({ [result.field]: result.code === "EMAIL_TAKEN" ? "EMAIL_TAKEN" : result.message });
        if (FIELD_STEP[result.field] !== step) {
          setDir("back");
          setStep(FIELD_STEP[result.field]);
        }
        requestAnimationFrame(() => refs[result.field].current?.focus());
      } else {
        setFailure(result.message);
      }
      return;
    }
    try {
      sessionStorage.removeItem(DRAFT);
    } catch {
      /* ignore */
    }
    setDone(result.company || { name: tidy(form.companyName) });
  };

  // "That email already has an account" gets a way out, not just a dead end.
  const emailError =
    errorOf("email") === "EMAIL_TAKEN" ? (
      <>
        This email already has a Nuformly account.{" "}
        <Link to="/company/login" state={{ email: normalizeEmail(form.email) }} className="au-inline-link">
          Log in instead
        </Link>
      </>
    ) : (
      errorOf("email")
    );

  const preview = (
    <AssistantPreview
      company={form.companyName}
      industry={form.industry}
      email={step === 2 || done ? form.email : ""}
      firstName={step === 2 || done ? firstName : ""}
      ready={Boolean(done)}
    />
  );

  return (
    <AuthLayout
      title="Create your account"
      variant="signup"
      scene={preview}
      switcher={
        !done && (
          <p className="au-switch">
            <span className="au-switch-q">Already have an account?</span> <Link to="/company/login">Log in</Link>
          </p>
        )
      }
    >
      {done ? (
        <div className="au-state au-in" role="status">
          <div className="au-state-art is-done">
            <FiCheck />
          </div>
          <h1 className="au-display au-title">You&apos;re all set{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="au-sub">
            <b>{done.name}</b> is ready. Taking you to your workspace…
          </p>
          <div className="au-progress" aria-hidden="true">
            <i />
          </div>
          <button type="button" className="au-btn" onClick={() => navigate("/company/overview", { replace: true })}>
            Open my workspace
          </button>
        </div>
      ) : (
        <div className="au-in">
          <ol className="au-stepper" aria-label={`Step ${step} of 2`}>
            {[
              [1, "Your business"],
              [2, "Your account"],
            ].map(([n, label]) => (
              <li key={n} className={`${step === n ? "is-current" : ""} ${step > n ? "is-done" : ""}`} aria-current={step === n ? "step" : undefined}>
                <span className="au-step-num">{step > n ? <FiCheck aria-hidden="true" /> : n}</span>
                {label}
              </li>
            ))}
          </ol>

          {step === 1 ? (
            <div key="s1" className={`au-step ${dir === "back" ? "is-back" : ""}`}>
              <h1 className="au-display au-title">Tell us about your business</h1>
              <p className="au-sub">Free plan · no card needed · your assistant is ready in minutes.</p>
              <form className="au-form" onSubmit={goStep2} noValidate>
                {failure && <Alert>{failure}</Alert>}
                <Field
                  ref={refs.companyName}
                  id="companyName"
                  name="organization"
                  label="Company name"
                  icon={FiBriefcase}
                  autoComplete="organization"
                  placeholder="e.g. Sunrise Solar"
                  maxLength={LIMITS.company[1] + 10}
                  value={form.companyName}
                  onChange={set("companyName")}
                  onBlur={touch("companyName")}
                  error={errorOf("companyName")}
                  valid={touched.companyName && !errors.companyName}
                />
                <fieldset className="au-fieldset" aria-describedby={errorOf("industry") ? "industry-note" : undefined}>
                  <legend className="au-label">What does your business do?</legend>
                  <div className="au-tiles" role="radiogroup" aria-label="Industry">
                    {INDUSTRY_OPTIONS.map((o, i) => {
                      const Icon = INDUSTRY_ICONS[o.value] || FiGrid;
                      const on = form.industry === o.value;
                      return (
                        <button
                          key={o.value}
                          ref={i === 0 ? refs.industry : undefined}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          tabIndex={on || (!form.industry && i === 0) ? 0 : -1}
                          className={`au-tile ${on ? "is-on" : ""}`}
                          style={{ "--i": i }}
                          onClick={() => {
                            set("industry")(o.value);
                            touch("industry")();
                          }}
                          onKeyDown={(e) => {
                            const keys = { ArrowRight: 1, ArrowDown: 4, ArrowLeft: -1, ArrowUp: -4 };
                            if (!(e.key in keys)) return;
                            e.preventDefault();
                            const next = INDUSTRY_OPTIONS[(i + keys[e.key] + INDUSTRY_OPTIONS.length) % INDUSTRY_OPTIONS.length];
                            set("industry")(next.value);
                            e.currentTarget.parentElement.querySelectorAll("button")[INDUSTRY_OPTIONS.indexOf(next)]?.focus();
                          }}
                        >
                          <Icon aria-hidden="true" />
                          <span>{o.label}</span>
                          {on && (
                            <span className="au-tile-check" aria-hidden="true">
                              <FiCheck />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errorOf("industry") && (
                    <p id="industry-note" className="au-note is-error" aria-live="polite">
                      <span>{errorOf("industry")}</span>
                    </p>
                  )}
                </fieldset>
                <SubmitButton>Continue</SubmitButton>
              </form>
            </div>
          ) : (
            <div key="s2" className={`au-step ${dir === "back" ? "is-back" : ""}`}>
              <button type="button" className="au-back" onClick={back}>
                <FiArrowLeft aria-hidden="true" /> Back to business details
              </button>
              <h1 className="au-display au-title">Create your account</h1>
              <p className="au-sub">You&apos;ll use these details to log in to your workspace.</p>
              <form className="au-form" onSubmit={submit} noValidate>
                {failure && <Alert>{failure}</Alert>}
                <Field
                  ref={refs.adminName}
                  id="adminName"
                  name="name"
                  label="Full name"
                  icon={FiUser}
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="e.g. Priya Sharma"
                  maxLength={LIMITS.name[1] + 10}
                  value={form.adminName}
                  onChange={set("adminName")}
                  onBlur={touch("adminName")}
                  error={errorOf("adminName")}
                  valid={touched.adminName && !errors.adminName}
                />
                <Field
                  ref={refs.email}
                  id="email"
                  name="email"
                  label="Work email"
                  icon={FiMail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="name@company.com"
                  maxLength={LIMITS.email}
                  value={form.email}
                  onChange={set("email")}
                  onBlur={touch("email")}
                  error={emailError}
                  valid={touched.email && !errors.email && !serverErrors.email && !suggestion}
                  hint={suggestion ? <EmailSuggestion suggestion={suggestion} onAccept={set("email")} /> : null}
                />
                <PasswordField
                  ref={refs.password}
                  id="password"
                  name="new-password"
                  icon={FiLock}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  maxLength={LIMITS.password[1]}
                  value={form.password}
                  onChange={set("password")}
                  onBlur={touch("password")}
                  error={errorOf("password")}
                  rules
                  ctx={ctx}
                />
                <SubmitButton loading={loading} loadingText="Creating your workspace…">
                  Create my workspace
                </SubmitButton>
                <p className="au-fine">No credit card needed.</p>
              </form>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
