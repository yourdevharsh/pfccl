import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../05-services/api";

const AuthContext = createContext(null);

function unpack(response) {
  return response?.data ?? response;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const payload = unpack(await authApi.me());
      setUser(payload.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  const login = useCallback(async (credentials) => {
    const payload = unpack(await authApi.login(credentials));
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    login,
    logout,
    refreshSession,
    can(permission) { return Boolean(user?.permissions?.includes(permission)); },
  }), [user, ready, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
