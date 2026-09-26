import { io } from "socket.io-client";

// Phase 15 — thin wrapper around the /admin Socket.IO namespace.
// Deliberately NOT a source of truth: every consumer treats an
// incoming event as "something changed, go refetch," never as data to
// render directly (Section 30/38). Connects with the same JWT
// services/api.js already reads from localStorage — no new auth
// mechanism, no new token.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin").replace(
  /\/api\/admin\/?$/,
  ""
);

let socket = null;
const statusListeners = new Set();
let status = "offline"; // "live" | "reconnecting" | "offline"

function setStatus(next) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((fn) => fn(status));
}

export function getRealtimeStatus() {
  return status;
}

export function onRealtimeStatusChange(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

/**
 * Idempotent — safe to call from multiple components; reuses the one
 * underlying connection. Returns null if there's no token yet (e.g.
 * pre-login), matching the same guard `api.js` already relies on.
 */
export function connectRealtime() {
  if (socket) return socket;

  const token = localStorage.getItem("nuformly-token");
  if (!token) return null;

  socket = io(`${SOCKET_URL}/admin`, {
    auth: { token },
    // Socket.IO's own backoff (Section 29) — exponential with a
    // sensible ceiling, not hand-rolled.
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => setStatus("live"));
  socket.on("disconnect", () => setStatus("reconnecting"));
  socket.on("reconnect_attempt", () => setStatus("reconnecting"));
  socket.on("connect_error", () => setStatus("reconnecting"));
  socket.io.on("reconnect_failed", () => setStatus("offline"));

  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  setStatus("offline");
}

/**
 * Joins a company's room, retrying the subscribe call on reconnect
 * (a fresh connection has no rooms). Returns an unsubscribe function.
 * Section 30/66 — this does NOT replace an initial/refresh REST
 * fetch; callers still fetch on mount, this only adds "refetch now"
 * triggers on top.
 */
export function subscribeCompany(companyId, onEvent) {
  const s = connectRealtime();
  if (!s || !companyId) return () => {};

  const join = () => s.emit("subscribe:company", companyId, () => {});
  join();
  s.on("connect", join);
  s.on("domain:event", onEvent);

  return () => {
    s.off("connect", join);
    s.off("domain:event", onEvent);
    s.emit("unsubscribe:company", companyId);
  };
}

/**
 * For pages spanning every company the admin can see (e.g. the
 * cross-company Conversations inbox) — the server resolves the
 * actual accessible set itself (access.service.js), never trusts a
 * client-supplied list.
 */
export function subscribeAccessibleCompanies(onEvent) {
  const s = connectRealtime();
  if (!s) return () => {};

  const join = () => s.emit("subscribe:accessible-companies", null, () => {});
  join();
  s.on("connect", join);
  s.on("domain:event", onEvent);

  return () => {
    s.off("connect", join);
    s.off("domain:event", onEvent);
  };
}

export function subscribeChatbot(chatbotId, onEvent) {
  const s = connectRealtime();
  if (!s || !chatbotId) return () => {};

  const join = () => s.emit("subscribe:chatbot", chatbotId, () => {});
  join();
  s.on("connect", join);
  s.on("domain:event", onEvent);

  return () => {
    s.off("connect", join);
    s.off("domain:event", onEvent);
    s.emit("unsubscribe:chatbot", chatbotId);
  };
}
