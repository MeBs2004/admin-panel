// Where the embeddable widget.js is served. Defaults to the live widget
// CDN; set VITE_WIDGET_URL (e.g. http://localhost:5173) when running
// locally, otherwise snippets load the live widget against the live
// backend.
export const WIDGET_URL = (import.meta.env.VITE_WIDGET_URL || "https://chatbot-frontend-nine-psi.vercel.app").replace(/\/+$/, "");

// Backend root for public (no-login) endpoints, derived from the admin
// API URL the rest of the panel already uses.
export const PUBLIC_API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin").replace(/\/api\/admin\/?$/, "");
