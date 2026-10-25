"use client";
import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeProvider";
import { useAuth } from "../components/AuthProvider";

export default function SettingsPage() {
  const { settings: globalSettings, updateSettings, resetToDefaults } = useTheme();
  const { user, updateApiKey, updateProfile, changePassword, setShowAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [apiKeyMessage, setApiKeyMessage] = useState("");

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security / Password State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState({
    ...globalSettings,
    density: "comfortable",
    glassBlur: 20,
    glassOpacity: 0.7,
    fontFamily: "sans",
    language: "en",
    autoSave: true,
    aiEnabled: true,
    aiCreativity: "balanced",
    experimental: false,
    defaultTemplate: "modern",
    exportFormat: "pdf",
  });

  const [saveStatus, setSaveStatus] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize draft from global settings (which handles localStorage and DB)
    setSettings(prev => ({ 
      ...prev, 
      ...globalSettings 
    }));
  }, [globalSettings]);

  // Sync profile fields from authenticated user
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setContactNo(user.contact_no || "");
    } else {
      setFullName("");
      setContactNo("");
    }
  }, [user]);

  // Apply theme and colors globally
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    
    // Apply custom accent color
    if (settings.accentColor) {
      root.style.setProperty("--accent", settings.accentColor);
      root.style.setProperty("--accent-light", `${settings.accentColor}dd`);
      root.style.setProperty("--accent-dark", `${settings.accentColor}aa`);
      root.style.setProperty("--glow", `${settings.accentColor}44`);
    }

    if (settings.backgroundColor) {
      root.style.setProperty("--background", settings.backgroundColor);
    } else {
      root.style.removeProperty("--background");
    }

    if (settings.surfaceColor) {
      root.style.setProperty("--surface", settings.surfaceColor);
    } else {
      root.style.removeProperty("--surface");
    }
  }, [settings.theme, settings.accentColor, settings.backgroundColor, settings.surfaceColor, mounted]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof settings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      setProfileStatus({ type: "error", text: "Full name is required." });
      return;
    }
    setProfileSaving(true);
    setProfileStatus(null);
    try {
      await updateProfile({ full_name: fullName.trim(), contact_no: contactNo.trim() || undefined });
      setProfileStatus({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setProfileStatus(null), 3500);
    } catch (err: unknown) {
      setProfileStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordStatus({ type: "error", text: "Current password is required." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    setPasswordStatus(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus(null), 3500);
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSave = async () => {
    updateSettings(settings);

    // Save profile if changed
    if (user && (fullName.trim() !== (user.full_name || "") || contactNo.trim() !== (user.contact_no || ""))) {
      if (fullName.trim()) {
        try {
          await updateProfile({ full_name: fullName.trim(), contact_no: contactNo.trim() || undefined });
        } catch {
          // Handled silently
        }
      }
    }

    setSaveStatus("Settings saved successfully!");
    setTimeout(() => setSaveStatus(""), 3000);
  };


  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div className="animate-fade-in-up" style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800,
            marginBottom: 12,
            background: "linear-gradient(135deg, var(--foreground), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textAlign: "center"
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-muted)", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          Customize your experience and preferences for the Artius Lab platform.
        </p>
      </div>

      <div className="animate-fade-in-up" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, animationDelay: "0.1s" }}>
        
        {/* Profile Section */}
        {user ? (
          <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
                <span style={{ fontSize: 24 }}>👤</span> Account & Profile
              </h2>
              <span style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 12,
                background: user.auth_provider === "google" ? "rgba(66, 133, 244, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: user.auth_provider === "google" ? "#4285f4" : "#10b981",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                {user.auth_provider === "google" ? "Google Account" : "Verified Email Account"}
              </span>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 24 }}>
                <div>
                  <label className="input-label">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Contact Number (Optional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={contactNo} 
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="Ex. +1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Email Address</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Primary Identity</span>
                  </label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={user.email} 
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(255,255,255,0.03)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  {profileStatus && (
                    <span style={{
                      fontSize: 13,
                      color: profileStatus.type === "success" ? "#10b981" : "#ef4444",
                      fontWeight: 500
                    }}>
                      {profileStatus.type === "success" ? "✓ " : "⚠️ "} {profileStatus.text}
                    </span>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: "8px 24px", fontSize: 14 }}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>

            {/* Security / Password section for local auth accounts */}
            {user.auth_provider === "local" && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-light)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 0
                  }}
                >
                  <span>🔒 Security & Password</span>
                  <span style={{ fontSize: 12 }}>{showPasswordSection ? "▲ Hide" : "▼ Change Password"}</span>
                </button>

                {showPasswordSection && (
                  <form onSubmit={handleChangePassword} style={{ marginTop: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label className="input-label">Current Password</label>
                        <input
                          type="password"
                          className="input-field"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div>
                        <label className="input-label">New Password (min 6 chars)</label>
                        <input
                          type="password"
                          className="input-field"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div>
                        <label className="input-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="input-field"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        {passwordStatus && (
                          <span style={{
                            fontSize: 13,
                            color: passwordStatus.type === "success" ? "#10b981" : "#ef4444",
                            fontWeight: 500
                          }}>
                            {passwordStatus.type === "success" ? "✓ " : "⚠️ "} {passwordStatus.text}
                          </span>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn-secondary"
                        style={{ padding: "8px 20px", fontSize: 13 }}
                        disabled={passwordSaving}
                      >
                        {passwordSaving ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22
                }}>
                  👤
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
                    Account & Profile Settings
                  </h2>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    You are currently browsing as a Guest
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 650, margin: 0 }}>
                Sign in or create a free account to personalize your profile, securely sync your resume preferences across devices, and manage your personal Groq API key.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "4px 0 8px" }}>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                  ✓ Profile Identity
                </span>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                  ✓ Cloud Sync Across Devices
                </span>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                  ✓ Personal Groq API Key
                </span>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAuthModal(true)}
                style={{ padding: "10px 24px", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
              >
                <span>Sign In / Create Account</span>
                <span>→</span>
              </button>
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚙️</span> Application Preferences
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Color Theme</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Switch between light and dark mode</p>
              </div>
              <select 
                className="input-field" 
                style={{ width: "auto", minWidth: 140 }}
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
              >
                <option value="creamy">Warm Creamy (Beige)</option>
                <option value="modern">Modern Space (Indigo)</option>
                <option value="dark">OLED Dark (Pure Black)</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Interface Density</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Control the spacing of UI elements</p>
              </div>
              <select 
                className="input-field" 
                style={{ width: "auto", minWidth: 140 }}
                value={settings.density}
                onChange={(e) => handleChange("density", e.target.value)}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact (Dense)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Accent Color Preset</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Pick a high-end signature color</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 260 }}>
                { ["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#e11d48", "#9333ea", "#0ea5e9", "#f97316", "#14b8a6"].map((color, i) => (
                  <div 
                    key={i}
                    onClick={() => handleChange("accentColor", color)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: color,
                      cursor: "pointer",
                      border: settings.accentColor === color ? "2px solid white" : "none",
                      boxShadow: settings.accentColor === color ? "0 0 10px " + color : "none"
                    }}
                  />
                ))}
                {/* Custom Color Picker Dot */}
                <div style={{ position: "relative", width: 20, height: 20, borderRadius: "50%", overflow: "hidden", border: !["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#e11d48", "#9333ea", "#0ea5e9", "#f97316", "#14b8a6"].includes(settings.accentColor) ? "2px solid white" : "1px solid var(--border)", cursor: "pointer" }}>
                  <input 
                    type="color" 
                    value={settings.accentColor} 
                    onChange={(e) => handleChange("accentColor", e.target.value)} 
                    style={{ position: "absolute", top: -5, left: -5, width: 30, height: 30, padding: 0, border: "none", background: "none", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.03)", gridColumn: "1 / -1" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Deep Granular Tuning</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                  <label className="input-label" style={{ marginBottom: 4 }}>Accent Override</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={settings.accentColor} onChange={(e) => handleChange("accentColor", e.target.value)} />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{settings.accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ marginBottom: 4 }}>Background</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={settings.backgroundColor || "#030014"} onChange={(e) => handleChange("backgroundColor", e.target.value)} />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{settings.backgroundColor || "Theme Default"}</span>
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ marginBottom: 4 }}>Card/Surface</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={settings.surfaceColor || "#0f0d23"} onChange={(e) => handleChange("surfaceColor", e.target.value)} />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{settings.surfaceColor || "Theme Default"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Language</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Choose your preferred interface language</p>
              </div>
              <select 
                className="input-field" 
                style={{ width: "auto", minWidth: 140 }}
                value={settings.language}
                onChange={(e) => handleChange("language", e.target.value)}
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Auto-save Active</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Automatically save changes to your resume</p>
              </div>
              <div 
                onClick={() => handleToggle("autoSave")}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: settings.autoSave ? "var(--accent)" : "var(--surface-light)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: settings.autoSave ? "0 0 12px var(--glow)" : "none"
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 4,
                  left: settings.autoSave ? 24 : 4,
                  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* Theme Customization Section */}
        <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎨</span> Theme Customization
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
            <div>
              <label className="input-label">Glass Blur Intensity ({settings.glassBlur}px)</label>
              <input 
                type="range" 
                min="0" max="40" step="1"
                style={{ width: "100%", accentColor: "var(--accent)" }}
                value={settings.glassBlur}
                onChange={(e) => handleChange("glassBlur", parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="input-label">Glass Opacity ({Math.round(settings.glassOpacity * 100)}%)</label>
              <input 
                type="range" 
                min="0.1" max="1" step="0.05"
                style={{ width: "100%", accentColor: "var(--accent)" }}
                value={settings.glassOpacity}
                onChange={(e) => handleChange("glassOpacity", parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Font Style</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select the primary typeface</p>
              </div>
              <select 
                className="input-field" 
                style={{ width: "auto", minWidth: 140 }}
                value={settings.fontFamily}
                onChange={(e) => handleChange("fontFamily", e.target.value)}
              >
                <option value="sans">Modern Sans</option>
                <option value="serif">Classic Serif</option>
                <option value="mono">Technical Mono</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Background Orbs</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Show animated background elements</p>
              </div>
              <div 
                onClick={() => handleToggle("showBackgroundOrbs")}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: settings.showBackgroundOrbs ? "var(--accent)" : "var(--surface-light)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: settings.showBackgroundOrbs ? "0 0 12px var(--glow)" : "none"
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 4,
                  left: settings.showBackgroundOrbs ? 24 : 4,
                  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* Document Defaults Section */}
        <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span> Document Defaults
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <div>
              <label className="input-label">Preferred Template</label>
              <select 
                className="input-field" 
                value={settings.defaultTemplate}
                onChange={(e) => handleChange("defaultTemplate", e.target.value)}
              >
                <option value="modern">Modern Minimalist</option>
                <option value="professional">Professional Corporate</option>
                <option value="creative">Creative Bold</option>
                <option value="executive">Executive Classic</option>
              </select>
            </div>
            <div>
              <label className="input-label">Default Export Format</label>
              <select 
                className="input-field" 
                value={settings.exportFormat}
                onChange={(e) => handleChange("exportFormat", e.target.value)}
              >
                <option value="pdf">Adobe PDF (.pdf)</option>
                <option value="docx">Microsoft Word (.docx)</option>
                <option value="txt">Plain Text (.txt)</option>
              </select>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🧠</span> AI & Intelligence
          </h2>
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>AI Suggestions</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Real-time content enhancement while you type</p>
              </div>
              <div 
                onClick={() => handleToggle("aiEnabled")}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: settings.aiEnabled ? "var(--accent)" : "var(--surface-light)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: settings.aiEnabled ? "0 0 15px var(--glow)" : "none"
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 4,
                  left: settings.aiEnabled ? 28 : 4,
                  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Creativity Level</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Control how bold the AI suggestions should be</p>
              </div>
              <select 
                className="input-field" 
                style={{ width: "auto", minWidth: 120 }}
                value={settings.aiCreativity}
                onChange={(e) => handleChange("aiCreativity", e.target.value)}
                disabled={!settings.aiEnabled}
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="bold">Bold & Creative</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Experimental Features</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Early access to upcoming tools (may be unstable)</p>
              </div>
              <div 
                onClick={() => handleToggle("experimental")}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: settings.experimental ? "var(--accent)" : "var(--surface-light)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: settings.experimental ? "0 0 15px var(--glow)" : "none"
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 4,
                  left: settings.experimental ? 28 : 4,
                  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>

            <div style={{ padding: "16px 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>AI Engine</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Groq Cloud LPU • Qwen 27B (Default)</p>
                </div>
                <span style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: user?.has_api_key ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: user?.has_api_key ? "#10b981" : "var(--text-muted)",
                  fontWeight: 600
                }}>
                  {user ? (user.has_api_key ? "Custom Key Active" : "Server Free Tier") : "Sign in to activate"}
                </span>
              </div>
              {user ? (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    type="password"
                    placeholder="Enter new Groq API key (optional)"
                    className="input-field"
                    value={personalApiKey}
                    onChange={(e) => setPersonalApiKey(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      try {
                        await updateApiKey(personalApiKey);
                        setApiKeyMessage("Groq API key updated!");
                        setPersonalApiKey("");
                        setTimeout(() => setApiKeyMessage(""), 3000);
                      } catch (err: unknown) {
                        setApiKeyMessage(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Save Key
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    Sign in to connect your own Groq API key for dedicated inference quota.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAuthModal(true)}
                    style={{ padding: "6px 14px", fontSize: 13 }}
                  >
                    Sign In
                  </button>
                </div>
              )}
              {apiKeyMessage && (
                <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 6 }}>{apiKeyMessage}</p>
              )}
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "20px 32px",
          background: "var(--surface-glass)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--border)",
          borderRadius: 20
        }}>
          <div style={{ color: "var(--accent-light)", fontWeight: 500, fontSize: 14 }}>
            {saveStatus ? "✓ " + saveStatus : "Unsaved changes detect automatically..."}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button 
              className="btn-secondary" 
              style={{ padding: "10px 24px", fontSize: 14 }}
              onClick={() => setShowResetConfirm(true)}
            >
              Reset
            </button>

            <button 
              className="btn-primary" 
              style={{ padding: "10px 32px", fontSize: 14 }}
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      {showResetConfirm && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.2s ease-out"
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div 
            className="glass"
            style={{
              padding: "40px 32px",
              borderRadius: "24px",
              maxWidth: "420px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--border)",
              animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "40px", marginBottom: "20px" }}>⚠️</div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px", color: "var(--foreground)" }}>Reset All Settings?</h3>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: "1.6" }}>
              This will revert your theme, colors, and all personal preferences to factory defaults. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                onClick={() => setShowResetConfirm(false)}
              >
                No, Keep Them
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1.2, padding: "12px", fontSize: "14px", background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
                onClick={() => {
                  resetToDefaults();
                  setShowResetConfirm(false);
                  setSaveStatus("Reset to factory defaults.");
                  setTimeout(() => setSaveStatus(""), 3000);
                }}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

