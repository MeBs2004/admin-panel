import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { companySignupApi } from "../services/api.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS } from "../config/companyProfileOptions.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function CompanySignup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [slugReason, setSlugReason] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-suggest the slug from the company name until the person
  // edits it themselves — once edited, their choice is never
  // overwritten by further typing in the name field.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(companyName));
  }, [companyName, slugEdited]);

  // Live, debounced, server-checked availability — never trusted as
  // the actual guarantee (registerCompany re-validates independently
  // and can still return 409 on a race).
  const checkRef = useRef(0);
  useEffect(() => {
    if (!slug) {
      setSlugStatus(null);
      setSlugReason("");
      return;
    }
    setSlugStatus("checking");
    const myCheck = ++checkRef.current;
    const timeout = setTimeout(() => {
      companySignupApi
        .get("/check-slug", { params: { slug } })
        .then((res) => {
          if (myCheck !== checkRef.current) return; // a newer check superseded this one
          setSlugStatus(res.data.available ? "available" : "taken");
          setSlugReason(res.data.reason || "");
        })
        .catch(() => {
          if (myCheck !== checkRef.current) return;
          setSlugStatus(null);
        });
    }, 400);
    return () => clearTimeout(timeout);
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim()) return setError("Company name is required.");
    if (!slug) return setError("Workspace URL is required.");
    if (slugStatus === "taken") return setError(slugReason || "This workspace URL is already taken.");
    if (!industry) return setError("Please select an industry.");
    if (!adminName.trim()) return setError("Your full name is required.");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid work email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    // Guards against a double-click/double-submit creating two
    // companies — the backend has no idempotency key for this route,
    // so this is the only protection against a repeated submission.
    if (loading || submitted) return;

    setLoading(true);
    const result = await register({
      companyName: companyName.trim(),
      workspaceSlug: slug,
      industry,
      companySize,
      adminName: adminName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      website: website.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSubmitted(true);
    navigate("/company/overview", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-10">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="mb-4 text-center text-xs font-medium">
          <Link to="/login" className="text-gray-400 hover:underline dark:text-gray-500">
            Staff / Platform Admin login
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white shadow-glow">
            N
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Nuformly
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create your company
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Company Sign Up
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
            />

            <div>
              <Input
                label="Workspace URL"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="acme"
              />
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">nuformly.app/{slug || "your-workspace"}</span>
                {slugStatus === "checking" && <span className="text-gray-400">Checking…</span>}
                {slugStatus === "available" && (
                  <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                    <FiCheck className="h-3 w-3" /> Available
                  </span>
                )}
                {slugStatus === "taken" && (
                  <span className="flex items-center gap-1 text-danger-600 dark:text-danger-400">
                    <FiX className="h-3 w-3" /> {slugReason || "Taken"}
                  </span>
                )}
              </div>
            </div>

            <Select
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={[{ value: "", label: "Select an industry" }, ...INDUSTRY_OPTIONS]}
            />

            <Input
              label="Your full name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Jane Doe"
            />

            <Input
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <Input
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Company website (optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
              />
              <Input
                label="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
              />
            </div>

            <Select
              label="Company size (optional)"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              options={COMPANY_SIZE_OPTIONS}
            />

            {error && (
              <p className="animate-fade-in-up rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} disabled={submitted} className="w-full">
              {loading ? "Creating your company..." : "Create Company"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/company/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
