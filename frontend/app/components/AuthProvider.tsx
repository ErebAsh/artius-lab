"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: number | string;
  email: string;
  full_name: string;
  contact_no?: string | null;
  avatar_url?: string | null;
  auth_provider?: string;
  has_api_key?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    contactNo?: string,
    groqApiKey?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateApiKey: (apiKey: string | null) => Promise<void>;
  updateProfile: (profile: { full_name: string; contact_no?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  loginWithGoogle: async () => {},
  updateApiKey: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
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

  // Restore session from localStorage on mount & verify
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const savedToken = localStorage.getItem("artius_token");
      const savedUser = localStorage.getItem("artius_user");

      if (savedToken && savedUser && isMounted) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(savedToken);

          // Verify token validity with backend asynchronously via server proxy
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          })
            .then((res) => {
              if (!res.ok) {
                // Token invalid or expired
                localStorage.removeItem("artius_token");
                localStorage.removeItem("artius_user");
                if (isMounted) {
                  setUser(null);
                  setToken(null);
                }
              } else {
                return res.json().then((freshUser) => {
                  if (isMounted && freshUser) {
                    setUser((prev) => ({ ...prev, ...freshUser }));
                    localStorage.setItem("artius_user", JSON.stringify(freshUser));
                  }
                });
              }
            })
            .catch(() => {
              // Network error or backend offline, keep cached session for offline capability
            });
        } catch {
          localStorage.removeItem("artius_token");
          localStorage.removeItem("artius_user");
        }
      }

      if (isMounted) setLoading(false);
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Relative URL /api/... routed securely through server-side proxy
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      contactNo?: string,
      groqApiKey?: string
    ) => {
      // Relative URL /api/... routed securely through server-side proxy
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          contact_no: contactNo?.trim() || null,
          groq_api_key: groqApiKey || null,
        }),
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
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    // Server-side OAuth redirect: No public keys or URLs exposed to the browser
    window.location.href = "/api/auth/google/login";
  }, []);

  const updateApiKey = useCallback(async (apiKey: string | null) => {
    const currentToken = token || localStorage.getItem("artius_token");
    if (!currentToken) return;

    const formData = new FormData();
    if (apiKey && apiKey.trim()) {
      formData.append("api_key", apiKey.trim());
    }

    const res = await fetch("/api/auth/api-key", {
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

  const updateProfile = useCallback(
    async (profile: { full_name: string; contact_no?: string }) => {
      const currentToken = token || localStorage.getItem("artius_token");
      if (!currentToken) throw new Error("Authentication required");

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          contact_no: profile.contact_no?.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to update profile" }));
        throw new Error(err.detail || "Failed to update profile");
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("artius_user", JSON.stringify(data.user));
      }
    },
    [token]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const currentToken = token || localStorage.getItem("artius_token");
      if (!currentToken) throw new Error("Authentication required");

      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to change password" }));
        throw new Error(err.detail || "Failed to change password");
      }
    },
    [token]
  );

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
        loginWithGoogle,
        updateApiKey,
        updateProfile,
        changePassword,
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
