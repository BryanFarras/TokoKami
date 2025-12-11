import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

// 1. Update Interface User: Pastikan ada properti 'role'
// Role bisa berupa 'admin', 'cashier', atau string lain
interface User {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'cashier' | string; // TAMBAHAN: Definisi role
  [key: string]: any;
}

// 2. Update Context Type: Tambahkan helper isAdmin dan isCashier
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;   // TAMBAHAN: Cek praktis apakah user adalah admin
  isCashier: boolean; // TAMBAHAN: Cek praktis apakah user adalah cashier
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
    try {
      // Try localStorage (remembered), then sessionStorage (non-remembered)
      const ls = normalizeToken(localStorage.getItem("token"));
      if (ls) return ls;
      const ss = normalizeToken(sessionStorage.getItem("token"));
      return ss;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Logika Penentuan Role
  // Ini akan otomatis bernilai true/false tergantung data user
  const isAdmin = user?.role === 'admin';
  const isCashier = user?.role === 'cashier';

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await api<any>("/auth/me");
      setUser(data || null);
      setError(null);
    } catch (err) {
      setUser(null);
      setError("Your session has expired. Sign in to continue.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }, rememberMe: boolean = true) => {
    try {
      setLoading(true);
      const data = await api<any>("/auth/login", { method: "POST", body: credentials });
      const receivedToken = normalizeToken(data?.token ?? null);
      if (receivedToken) {
        setToken(receivedToken);
        // Store based on rememberMe
        if (rememberMe) {
          localStorage.setItem("token", receivedToken);
          sessionStorage.removeItem("token"); // ensure single source
        } else {
          sessionStorage.setItem("token", receivedToken);
          localStorage.removeItem("token");
        }
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
      }
      // Pastikan backend mengirim object user yang berisi field 'role'
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
      sessionStorage.removeItem("token");
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
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAdmin,    // Masukkan ke value provider
      isCashier,  // Masukkan ke value provider
      login,
      logout,
      fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};