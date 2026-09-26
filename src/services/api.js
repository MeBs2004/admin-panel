import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin";

// Phase 11 — the public, unauthenticated invitation-acceptance
// endpoints live outside /api/admin (see backend/index.js), since
// everything under /api/admin always requires a Bearer token. A
// separate client (no Authorization interceptor, no 401->/login
// redirect) is correct here, not a hack around the main one.
export const invitationsApi = axios.create({
  baseURL: API_URL.replace(/\/api\/admin\/?$/, "/api/invitations"),
  timeout: 30000,
});

// Phase 14 — neither axios instance had a timeout before this: a
// hung backend/network request left the UI stuck in a loading state
// indefinitely instead of ever surfacing an error + retry. 30s is
// generous enough for the slowest legitimate calls (AI test
// playground, knowledge base file extraction) while still bounding
// the wait.
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

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
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to connect to Nuformly. Please try again.";

export default api;
