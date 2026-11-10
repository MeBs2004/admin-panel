import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiPhone, FiBriefcase, FiArrowLeft, FiZap, FiBookOpen, FiTrendingUp, FiMessageSquare, FiGrid, FiCheck, FiShield } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { INDUSTRY_OPTIONS } from "../../config/companyProfileOptions.js";
import { checkName, checkCompanyName, checkEmail, checkPassword, checkPhone, normalizeEmail, tidy, LIMITS } from "../../config/accountRules.js";
import AuthLayout, { AssistantPreview } from "./AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EmailSuggestion, suggestEmail, useTouched } from "./fields.jsx";

// Same four values as the chatbot sector templates, plus "Other" — see
// backend/config/industries.js. "General" reuses that sector's own icon
// (config/sectorTemplates.js) for consistency between the two pickers.
const INDUSTRY_ICONS = {
  Energy: FiZap,
  Education: FiBookOpen,
  "Digital Marketing": FiTrendingUp,
  General: FiMessageSquare,
  Other: FiGrid,
};

const STEP_FIELDS = { 1: ["companyName", "industry"], 2: ["adminName", "phone", "email", "password"] };
const FIELD_STEP = { companyName: 1, industry: 1, adminName: 2, phone: 2, email: 2, password: 2, otp: 2 };
const EMPTY = { companyName: "", industry: "", adminName: "", phone: "", email: "", password: "" };
const RESEND_AFTER = 30; // seconds

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
  const { register, sendSignupOtp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(loadDraft);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("fwd");
  const { touched, touch, touchAll } = useTouched();
  const [serverErrors, setServerErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  // "form": still filling in step 2 · "otp": a code was sent, waiting to
  // be typed in and verified (that's the call that actually creates the
  // account — see submit()).
  const [otpPhase, setOtpPhase] = useState("form");
  const [otp, setOtp] = useState("");
  const [otpTouched, setOtpTouched] = useState(false);
  const [otpWait, setOtpWait] = useState(0);
  const refs = { companyName: useRef(null), industry: useRef(null), adminName: useRef(null), phone: useRef(null), email: useRef(null), password: useRef(null), otp: useRef(null) };
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
    if (otpPhase === "otp") refs.otp.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpPhase]);

  useEffect(() => {
    if (!otpWait) return undefined;
    const t = setTimeout(() => setOtpWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [otpWait]);

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
    phone: checkPhone(form.phone),
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
    setOtpPhase("form");
  };

  // Shared by the field-level errors a login-style failure can carry,
  // whichever request (send-otp or the final verify-and-create) hit it.
  const routeFailure = (result) => {
    if (result.timedOut) {
      setFailure("Nuformly is still waking up — this can take up to a minute on first use. Please try again.");
    } else if (result.offline) {
      setFailure("Can't reach Nuformly right now. Check your internet connection and try again.");
    } else if (result.status === 429) {
      setFailure(result.retryAfter ? `Too many attempts. Please wait about ${Math.ceil(result.retryAfter / 60)} minute(s) and try again.` : "Too many attempts. Please wait a few minutes and try again.");
    } else if (result.field === "otp") {
      setOtpPhase("otp");
      setOtpTouched(true);
      setServerErrors({ otp: result.message });
      requestAnimationFrame(() => refs.otp.current?.focus());
    } else if (result.field && FIELD_STEP[result.field]) {
      // Something about an already-collected field was wrong (e.g. the
      // email got taken by someone else between sending the code and
      // verifying it) — back out of the OTP screen so the field is visible.
      setOtpPhase("form");
      setServerErrors({ [result.field]: result.code === "EMAIL_TAKEN" ? "EMAIL_TAKEN" : result.message });
      if (FIELD_STEP[result.field] !== step) {
        setDir("back");
        setStep(FIELD_STEP[result.field]);
      }
      requestAnimationFrame(() => refs[result.field].current?.focus());
    } else {
      setFailure(result.message);
    }
  };

  // Step 2's submit, while still in "form" phase: validates the fields,
  // then emails a verification code instead of creating the account yet.
  const requestOtp = async (e) => {
    e?.preventDefault();
    if (loading) return;
    touchAll(STEP_FIELDS[2]);
    const bad = firstInvalid(STEP_FIELDS[2]);
    if (bad) return refs[bad].current?.focus();
    setFailure("");
    setLoading(true);
    const result = await sendSignupOtp(normalizeEmail(form.email));
    setLoading(false);
    if (!result.success) return routeFailure(result);
    setOtp("");
    setOtpTouched(false);
    setServerErrors((s) => ({ ...s, otp: "" }));
    setOtpPhase("otp");
    setOtpWait(RESEND_AFTER);
  };

  const otpError = otpTouched && !/^\d{6}$/.test(otp) ? "Enter the 6-digit code we emailed you." : serverErrors.otp || "";

  // The OTP screen's submit — the call that actually creates the account.
  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setOtpTouched(true);
    if (!/^\d{6}$/.test(otp)) return refs.otp.current?.focus();
    setFailure("");
    setLoading(true);
    creating.current = true;
    const result = await register({
      companyName: tidy(form.companyName),
      industry: form.industry,
      adminName: tidy(form.adminName),
      phone: tidy(form.phone),
      email: normalizeEmail(form.email),
      password: form.password,
      confirmPassword: form.password,
      otp,
    });
    setLoading(false);
    if (!result.success) {
      creating.current = false;
      return routeFailure(result);
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
              <button type="button" className="au-back" onClick={otpPhase === "otp" ? () => setOtpPhase("form") : back}>
                <FiArrowLeft aria-hidden="true" /> {otpPhase === "otp" ? "Change email" : "Back to business details"}
              </button>
              {otpPhase === "otp" ? (
                <>
                  <h1 className="au-display au-title">Check your email</h1>
                  <p className="au-sub">
                    We sent a 6-digit code to <b>{normalizeEmail(form.email)}</b>. Enter it below to create your workspace.
                  </p>
                  <form className="au-form" onSubmit={submit} noValidate>
                    {failure && <Alert>{failure}</Alert>}
                    <Field
                      ref={refs.otp}
                      id="otp"
                      name="one-time-code"
                      label="Verification code"
                      icon={FiShield}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (serverErrors.otp) setServerErrors((s) => ({ ...s, otp: "" }));
                      }}
                      onBlur={() => setOtpTouched(true)}
                      error={otpError}
                      valid={otpTouched && !otpError}
                    />
                    <SubmitButton loading={loading} loadingText="Creating your workspace…">
                      Verify &amp; create account
                    </SubmitButton>
                    <p className="au-hint" style={{ marginTop: 14 }}>
                      Didn&apos;t get it? Check spam, or{" "}
                      {otpWait ? (
                        <span>resend in {otpWait}s</span>
                      ) : (
                        <button type="button" onClick={requestOtp} disabled={loading}>
                          {loading ? "sending…" : "send a new code"}
                        </button>
                      )}
                      .
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="au-display au-title">Create your account</h1>
                  <p className="au-sub">You&apos;ll use these details to log in to your workspace.</p>
                  <form className="au-form" onSubmit={requestOtp} noValidate>
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
                      ref={refs.phone}
                      id="phone"
                      name="tel"
                      label="Phone number"
                      icon={FiPhone}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      maxLength={LIMITS.phone + 5}
                      value={form.phone}
                      onChange={set("phone")}
                      onBlur={touch("phone")}
                      error={errorOf("phone")}
                      valid={touched.phone && !errors.phone}
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
                    <SubmitButton loading={loading} loadingText="Sending code…">
                      Send verification code
                    </SubmitButton>
                    <p className="au-fine">No credit card needed.</p>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
