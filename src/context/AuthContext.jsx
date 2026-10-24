import { createContext, useContext, useEffect, useState } from "react";
import api, { companySignupApi, getErrorMessage } from "../services/api.js";
import { connectRealtime, disconnectRealtime } from "../services/realtime.js";

const AuthContext = createContext(null);

// What a login/sign-up page needs to explain a failure: the status, which
// field the server objected to, how long to wait after too many attempts,
// and whether the server could be reached at all.
function failure(error) {
  const res = error?.response;
  const wait = Number(res?.headers?.["retry-after"] ?? res?.headers?.["ratelimit-reset"]);
  return {
    success: false,
    message: getErrorMessage(error),
    status: res?.status ?? 0,
    field: res?.data?.field || null,
    code: res?.data?.code || null,
    retryAfter: Number.isFinite(wait) && wait > 0 ? wait : null,
    offline: !res,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("nuformly-user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshMe = () =>
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("nuformly-user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("nuformly-token");
        localStorage.removeItem("nuformly-user");
        setUser(null);
      });

  // Realtime connects once we actually have a verified user, not just
  // a token — mirrors the same trust boundary /auth/me already
  // enforces (an invalid/expired token clears `user` below).
  useEffect(() => {
    if (!user) {
      disconnectRealtime();
      return;
    }
    const socket = connectRealtime();
    if (!socket) return;

    // Section 16/26 — every admin socket auto-joins its own
    // `user:<id>` room server-side on connect, so no subscribe call
    // is needed here; this just reacts to it. A role change refetches
    // /auth/me live instead of leaving the tab's permissions stale
    // until next reload. Status/access revocation is handled
    // differently server-side (a forced disconnect, not this event —
    // see disconnectUserSockets in the backend) and needs no handling
    // here: Socket.IO's own reconnection will hit the auth middleware
    // again and simply fail if the account is no longer ACTIVE.
    const onEvent = (evt) => {
      if (evt.type === "user.updated") refreshMe();
    };
    socket.on("domain:event", onEvent);
    return () => socket.off("domain:event", onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(user)]);

  useEffect(() => {
    const token = localStorage.getItem("nuformly-token");
    if (!token) {
      setLoading(false);
      return;
    }

    refreshMe().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `panel`: "platform" (/login — super admins only) or "company"
  // (/company/login — company accounts only). The backend enforces it.
  const login = async (email, password, panel) => {
    try {
      const res = await api.post("/auth/login", { email, password, ...(panel ? { panel } : {}) });
      localStorage.setItem("nuformly-token", res.data.token);
      localStorage.setItem("nuformly-user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      // `refused`: the server said the credentials don't work here — a wrong
      // password, or an account used on the wrong login page (old servers say
      // that with a USE_* code, new ones with a plain 401). Login pages show
      // one generic message for it, so they never reveal which case it was.
      const data = error?.response?.data;
      const refused = error?.response?.status === 401 || String(data?.code || "").startsWith("USE_");
      return { ...failure(error), refused };
    }
  };

  // Company self-registration — creates the Company + first
  // COMPANY_ADMIN account on the backend and logs the caller straight
  // in with the real token it returns, same success/failure contract
  // as login() above (never throws).
  const register = async (payload) => {
    try {
      const res = await companySignupApi.post("/", payload);
      localStorage.setItem("nuformly-token", res.data.token);
      localStorage.setItem("nuformly-user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true, company: res.data.company };
    } catch (error) {
      return failure(error);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort
    }
    localStorage.removeItem("nuformly-token");
    localStorage.removeItem("nuformly-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
