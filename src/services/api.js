import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin";

// Phase 11 — the public, unauthenticated invitation-acceptance
// endpoints live outside /api/admin (see backend/index.js), since
// everything under /api/admin always requires a Bearer token. A
// separate client (no Authorization interceptor, no 401->/login
// redirect) is correct here, not a hack around the main one.
// 60s (not 30s) on these three unauthenticated "first contact" clients —
// a Render free-tier backend spins down after ~15 minutes idle and can
// take 30-60s to cold-start on the very next request, which a 30s
// timeout would miss entirely and misreport as "can't reach server".
const COLD_START_TIMEOUT = 60000;

export const invitationsApi = axios.create({
  baseURL: API_URL.replace(/\/api\/admin\/?$/, "/api/invitations"),
  timeout: COLD_START_TIMEOUT,
});

// Public company self-registration — same reasoning as invitationsApi
// above: POST /api/company-signup is unauthenticated (it's how an
// account/token is created in the first place), so it gets its own
// client with no Authorization interceptor and no 401 redirect.
export const companySignupApi = axios.create({
  baseURL: API_URL.replace(/\/api\/admin\/?$/, "/api/company-signup"),
  timeout: COLD_START_TIMEOUT,
});

// Public password reset for company accounts (forgot → email link → reset).
export const passwordResetApi = axios.create({
  baseURL: API_URL.replace(/\/api\/admin\/?$/, "/api/password-reset"),
  timeout: COLD_START_TIMEOUT,
});

// Phase 14 — neither axios instance had a timeout before this: a
// hung backend/network request left the UI stuck in a loading state
// indefinitely instead of ever surfacing an error + retry. 60s is
// generous enough for the slowest legitimate calls (AI test
// playground, knowledge base file extraction, a cold-starting Render
// backend on login) while still bounding the wait.
const api = axios.create({ baseURL: API_URL, timeout: COLD_START_TIMEOUT });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nuformly-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nuformly-token");
      localStorage.removeItem("nuformly-user");
      const onCompanySide = window.location.pathname.startsWith("/company");
      const loginPath = onCompanySide ? "/company/login" : "/login";
      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to connect to Nuformly. Please try again.";

export default api;
