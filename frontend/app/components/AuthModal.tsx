"use client";
import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, fullName, geminiApiKey || undefined);
      }
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      setGeminiApiKey("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="auth-modal-close"
          onClick={() => setShowAuthModal(false)}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Decorative gradient bar */}
        <div className="auth-modal-gradient-bar" />

        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="auth-modal-title">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === "login"
              ? "Sign in to save & manage your resumes"
              : "Join Artius Lab to build stunning resumes"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-modal-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-modal-form">
          {mode === "register" && (
            <div className="auth-input-group">
              <label className="auth-input-label">Full Name</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="auth-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                Gemini API Key{" "}
                <span style={{ opacity: 0.45, fontSize: "0.8em", fontWeight: 400 }}>(optional)</span>
              </label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Leave blank to use free built-in AI"
                  className="auth-input"
                  autoComplete="off"
                />
              </div>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary, #888)",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                🤖 No key? No problem — we use a built-in AI for free.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Switch mode */}
        <p className="auth-switch-text">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
