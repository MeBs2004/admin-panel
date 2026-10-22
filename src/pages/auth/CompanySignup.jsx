import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiBriefcase, FiArrowLeft, FiZap, FiBookOpen, FiTrendingUp, FiCpu, FiDollarSign, FiHeart, FiShoppingBag, FiGrid, FiCheck } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { INDUSTRY_OPTIONS } from "../../config/companyProfileOptions.js";
import AuthLayout from "./AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EMAIL_RE, suggestEmail } from "./fields.jsx";

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

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  "--i": i,
  "--x": `${Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30))}px`,
  "--y": `${Math.round(Math.sin((i / 18) * Math.PI * 2) * (80 + (i % 4) * 22))}px`,
  "--r": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
  "--c": ["#34d399", "#0d5537", "#f2711c", "#a7f3d0", "#6366f1"][i % 5],
}));

/**
 * Company sign-up (/company/signup): only what's needed to open a workspace.
 *   1. you — name, work email, password
 *   2. your business — company name, industry
 * Everything else (website, phone, size, branding) lives in settings later.
 */
export default function CompanySignup() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("fwd");
  const [form, setForm] = useState({ adminName: "", email: "", password: "", companyName: "", industry: "" });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const firstRef = useRef(null);
  const companyRef = useRef(null);
  // set while this page is signing someone up, so the new session doesn't
  // bounce them past the "all set" screen
  const creating = useRef(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    (step === 1 ? firstRef : companyRef).current?.focus();
  }, [step]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate("/company/overview", { replace: true }), 2600);
    return () => clearTimeout(t);
  }, [done, navigate]);

  if (user && user.role !== "SUPER_ADMIN" && !done && !creating.current) return <Navigate to="/company/overview" replace />;

  const errors = {
    adminName: !form.adminName.trim() ? "Tell us your name." : "",
    email: !EMAIL_RE.test(form.email.trim()) ? "Enter a valid work email." : "",
    password: form.password.length < 8 ? "Use at least 8 characters." : "",
    companyName: !form.companyName.trim() ? "Enter your company's name." : "",
    industry: !form.industry ? "Pick the closest match." : "",
  };
  const show = (k) => (touched[k] ? errors[k] : "");
  const suggestion = !errors.email && suggestEmail(form.email.trim());

  const goStep2 = (e) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, adminName: true, email: true, password: true }));
    if (errors.adminName || errors.email || errors.password) return;
    setError("");
    setDir("fwd");
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, companyName: true, industry: true }));
    if (errors.companyName || errors.industry) return;
    setError("");
    setLoading(true);
    creating.current = true;
    const result = await register({
      adminName: form.adminName.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.password,
      companyName: form.companyName.trim(),
      industry: form.industry,
    });
    setLoading(false);
    if (!result.success) {
      creating.current = false;
      // an email that's already registered belongs to step 1
      if (/email/i.test(result.message || "")) {
        setDir("back");
        setStep(1);
      }
      setError(result.message);
      return;
    }
    setDone(result.company || { name: form.companyName.trim() });
  };

  const first = form.adminName.trim().split(/\s+/)[0];

  return (
    <AuthLayout
      title="Create your account"
      variant="signup"
      step={done ? 3 : step === 1 ? 0 : 1}
      switcher={
        !done && (
          <p className="au-switch">
            Already have an account?<Link to="/company/login">Log in</Link>
          </p>
        )
      }
    >
      {done ? (
        <div className="au-state au-in" role="status">
          <div className="au-state-art">
            <span className="au-confetti" aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <i key={i} style={c} />
              ))}
            </span>
            <FiCheck />
          </div>
          <h1 className="au-display au-title">You&apos;re all set{first ? `, ${first}` : ""}!</h1>
          <p className="au-sub">
            <b>{done.name}</b> is ready. Taking you to your workspace…
          </p>
          <div style={{ marginTop: 28 }}>
            <button type="button" className="au-btn" onClick={() => navigate("/company/overview", { replace: true })}>
              Open my workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="au-in">
          <div className="au-steps" aria-label={`Step ${step} of 2`}>
            {step === 2 && (
              <button
                type="button"
                className="au-back"
                onClick={() => {
                  setDir("back");
                  setStep(1);
                  setError("");
                }}
              >
                <FiArrowLeft /> Back
              </button>
            )}
            <span>Step {step} of 2</span>
            <span className="au-steps-bar" aria-hidden="true">
              <span style={{ width: step === 1 ? "50%" : "100%" }} />
            </span>
          </div>

          {step === 1 ? (
            <div key="s1" className={`au-step ${dir === "back" ? "is-back" : ""}`}>
              <h1 className="au-display au-title">Create your free account</h1>
              <p className="au-sub">Free plan · no card needed · set up in minutes.</p>
              <form className="au-form" onSubmit={goStep2} noValidate>
                {error && <Alert>{error}</Alert>}
                <Field ref={firstRef} id="name" label="Your full name" icon={FiUser} autoComplete="name" value={form.adminName} onChange={set("adminName")} onBlur={touch("adminName")} error={show("adminName")} valid={touched.adminName && !errors.adminName} />
                <Field
                  id="email"
                  label="Work email"
                  icon={FiMail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={touch("email")}
                  error={show("email")}
                  valid={touched.email && !errors.email}
                  hint={
                    suggestion ? (
                      <>
                        Did you mean{" "}
                        <button type="button" onClick={() => setForm((f) => ({ ...f, email: suggestion }))}>
                          {suggestion}
                        </button>
                        ?
                      </>
                    ) : null
                  }
                />
                <PasswordField id="password" icon={FiLock} autoComplete="new-password" value={form.password} onChange={set("password")} onBlur={touch("password")} error={show("password")} strength />
                <SubmitButton>Continue</SubmitButton>
              </form>
            </div>
          ) : (
            <div key="s2" className={`au-step ${dir === "back" ? "is-back" : ""}`}>
              <h1 className="au-display au-title">{first ? `Nice to meet you, ${first}.` : "About your business"}</h1>
              <p className="au-sub">Two quick details so we can set up the right assistant for you.</p>
              <form className="au-form" onSubmit={submit} noValidate>
                {error && <Alert>{error}</Alert>}
                <Field ref={companyRef} id="company" label="Company name" icon={FiBriefcase} autoComplete="organization" value={form.companyName} onChange={set("companyName")} onBlur={touch("companyName")} error={show("companyName")} valid={touched.companyName && !errors.companyName} />
                <fieldset>
                  <legend className="au-legend">Your industry</legend>
                  <div className="au-tiles" role="radiogroup" aria-label="Your industry">
                    {INDUSTRY_OPTIONS.map((o, i) => {
                      const Icon = INDUSTRY_ICONS[o.value] || FiGrid;
                      const on = form.industry === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          className={`au-tile ${on ? "is-on" : ""}`}
                          style={{ "--i": i }}
                          onClick={() => setForm((f) => ({ ...f, industry: o.value }))}
                        >
                          {on && (
                            <span className="au-tile-check" aria-hidden="true">
                              <FiCheck />
                            </span>
                          )}
                          <Icon aria-hidden="true" />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {show("industry") && (
                    <p className="au-hint is-error" role="alert">
                      {errors.industry}
                    </p>
                  )}
                </fieldset>
                <SubmitButton loading={loading} loadingText="Creating your workspace…">
                  Create my workspace
                </SubmitButton>
                <p className="au-hint" style={{ textAlign: "center" }}>
                  You can add your website, logo and team later in settings.
                </p>
              </form>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
