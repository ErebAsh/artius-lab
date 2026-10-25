"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
];

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, register, loginWithGoogle } = useAuth();

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactCode, setContactCode] = useState("+91");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    }
  }, [user, router, searchParams]);

  // Sync mode with query params if changed
  useEffect(() => {
    const qMode = searchParams.get("mode");
    if (qMode === "signup" || qMode === "login") {
      setMode(qMode);
    }
  }, [searchParams]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 50, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 75, label: "Good", color: "#3b82f6" };
      case 4:
        return { score: 100, label: "Strong", color: "#10b981" };
      default:
        return { score: 10, label: "Too short", color: "#ef4444" };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        router.push(searchParams.get("redirect") || "/");
      } else {
        // Validation for signup
        if (!fullName.trim()) {
          throw new Error("Full name is required.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const fullContactNo = contactNumber.trim()
          ? `${contactCode} ${contactNumber.trim()}`
          : undefined;

        await register(email, password, fullName, fullContactNo);
        setSuccessMsg("Account created successfully!");
        router.push(searchParams.get("redirect") || "/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google authentication failed. Please verify Supabase setup."
      );
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--accent)] opacity-15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--accent-light)] opacity-10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10 transition-all">
        
        {/* Left Side: Brand Visual & Value Proposition (Hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-light)] border-r border-[var(--border)] relative overflow-hidden">
          <div className="relative z-10">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--glow)] group-hover:scale-105 transition-transform">
                ✦
              </div>
              <span className="font-extrabold text-xl tracking-wider text-[var(--foreground)]">
                ARTIUS LAB
              </span>
            </Link>

            <div className="mt-12 space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
                Craft Your Dream Resume with Intelligence.
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Join thousands of ambitious professionals using AI to build ATS-optimized resumes in minutes.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span>41+ High-Impact ATS-friendly templates</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span>AI Content Enhancement powered by Qwen 27B</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span>Real-time ATS score analysis & audit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} Artius Lab. Precision AI Engineering.
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-white font-bold text-sm">
                ✦
              </div>
              <span className="font-bold text-lg tracking-wider">ARTIUS LAB</span>
            </Link>
            <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
              ← Back to Home
            </Link>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[var(--surface-light)] p-1 rounded-2xl border border-[var(--border)] mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                mode === "login"
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                mode === "signup"
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === "login" ? "Welcome back" : "Get started with Artius Lab"}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              {mode === "login"
                ? "Sign in with your email or Google account to access your resumes."
                : "Create your free account to build and export professional resumes."}
            </p>
          </div>

          {/* Google 1-Click Login Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-light)] text-[var(--foreground)] font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md disabled:opacity-60 cursor-pointer mb-6"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Error / Success Notifications */}
          {error && (
            <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2.5 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M9 12l2 2 4-4" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Himanshu Raj"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--glow)] transition-all placeholder:text-[var(--text-muted)]/50"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--glow)] transition-all placeholder:text-[var(--text-muted)]/50"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Contact Number (Sign Up only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                  Contact Number <span className="text-xs text-[var(--text-muted)] font-normal lowercase">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={contactCode}
                    onChange={(e) => setContactCode(e.target.value)}
                    className="px-2.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--glow)] transition-all placeholder:text-[var(--text-muted)]/50"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Password <span className="text-red-500">*</span>
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      alert("Password reset instructions will be sent to your email.");
                    }}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
                    <path strokeWidth="2" strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--glow)] transition-all placeholder:text-[var(--text-muted)]/50"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength bar for signup */}
              {mode === "signup" && password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-[var(--surface-light)] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${passwordStrength.score}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--text-muted)]">Strength</span>
                    <span style={{ color: passwordStrength.color }} className="font-semibold">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox (Login) */}
            {mode === "login" && (
              <div className="flex items-center pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-[var(--text-muted)] cursor-pointer">
                  Keep me signed in on this device
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] hover:shadow-lg hover:shadow-[var(--glow)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Sign In to Artius Lab"
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          {/* Terms Disclaimer */}
          {mode === "signup" && (
            <p className="text-[11px] text-center text-[var(--text-muted)] mt-4 leading-normal">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[var(--foreground)] underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[var(--foreground)] underline underline-offset-2">
                Privacy Policy
              </Link>.
            </p>
          )}

          {/* Switch Tab Footer */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="font-bold text-[var(--accent)] hover:underline ml-1"
              >
                {mode === "login" ? "Sign up for free" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    }>
      <AuthFormContent />
    </Suspense>
  );
}
