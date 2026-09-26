import { createContext, useContext, useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { connectRealtime, disconnectRealtime } from "../services/realtime.js";

const AuthContext = createContext(null);

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

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("nuformly-token", res.data.token);
      localStorage.setItem("nuformly-user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
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
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
