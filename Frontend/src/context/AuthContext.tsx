import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

interface User { id: string; name?: string; email?: string; [key: string]: any; }
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function normalizeToken(raw?: string | null) {
  if (!raw) return null;
  const t = String(raw).trim();
  return t.replace(/^"|"$/g, "") || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try { return normalizeToken(localStorage.getItem("token")); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await api<any>("/auth/me");
      setUser(data || null);
      setError(null);
    } catch (err) {
      setUser(null);
      setError("Failed to fetch user");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      const data = await api<any>("/auth/login", { method: "POST", body: credentials });
      const receivedToken = normalizeToken(data?.token ?? null);
      if (receivedToken) {
        setToken(receivedToken);
        localStorage.setItem("token", receivedToken);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
      if (data?.user) setUser(data.user);
      else setUser(data || null);
      setError(null);
    } catch (err) {
      setError("Login failed");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api("/auth/logout", { method: "POST" }).catch(()=>{});
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCurrentUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};