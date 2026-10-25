"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  id: number;
  email: string;
  full_name: string;
  has_api_key?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, groqApiKey?: string) => Promise<void>;
  updateApiKey: (apiKey: string | null) => Promise<void>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  /** Call this before any gated action — if not logged in, opens modal & returns false */
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
    login: async () => {},
  register: async () => {},
  updateApiKey: async () => {},
  logout: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  requireAuth: () => false,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("artius_token");
    const savedUser = localStorage.getItem("artius_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("artius_token");
        localStorage.removeItem("artius_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("artius_token", data.token);
    localStorage.setItem("artius_user", JSON.stringify(data.user));
    setShowAuthModal(false);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, groqApiKey?: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, groq_api_key: groqApiKey || null }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("artius_token", data.token);
    localStorage.setItem("artius_user", JSON.stringify(data.user));
    setShowAuthModal(false);
  }, []);

  const updateApiKey = useCallback(async (apiKey: string | null) => {
    const currentToken = token || localStorage.getItem("artius_token");
    if (!currentToken) return;

    const formData = new FormData();
    if (apiKey && apiKey.trim()) {
      formData.append("api_key", apiKey.trim());
    }

    const res = await fetch(`${API_BASE}/api/auth/api-key`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${currentToken}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to update API key" }));
      throw new Error(err.detail || "Failed to update API key");
    }

    const data = await res.json();
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, has_api_key: Boolean(data.has_api_key) };
      localStorage.setItem("artius_user", JSON.stringify(updated));
      return updated;
    });
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("artius_token");
    localStorage.removeItem("artius_user");
  }, []);

  const requireAuth = useCallback(() => {
    if (user && token) return true;
    setShowAuthModal(true);
    return false;
  }, [user, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateApiKey,
        logout,
        showAuthModal,
        setShowAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
