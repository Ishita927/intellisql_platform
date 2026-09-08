"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMe, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("intellisql_token");
    if (stored) {
      setTokenState(stored);
      getMe(stored)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("intellisql_token");
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setToken = (newToken: string) => {
    localStorage.setItem("intellisql_token", newToken);
    setTokenState(newToken);
    getMe(newToken).then(setUser).catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem("intellisql_token");
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}