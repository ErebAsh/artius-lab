"use client";
import React, { useState, useEffect } from "react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    theme: "dark",
    accentColor: "#6366f1",
    backgroundColor: "", // Empty means use theme default
    surfaceColor: "", // Empty means use theme default
    density: "comfortable",
    glassBlur: 20,
    glassOpacity: 0.7,
    fontFamily: "sans",
    showBackgroundOrbs: true,
    language: "en",
    autoSave: true,
    aiEnabled: true,
    aiCreativity: "balanced",
    experimental: false,
    defaultTemplate: "modern",
    exportFormat: "pdf",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
  });

  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedSettings = localStorage.getItem("artius_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

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

  const handleSave = () => {
    localStorage.setItem("artius_settings", JSON.stringify(settings));
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
            background: "linear-gradient(135deg, #fff, var(--accent-light))",
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
        <section className="glass" style={{ padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>👤</span> Profile Settings
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <div>
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={settings.userName} 
                onChange={(e) => handleChange("userName", e.target.value)}
                placeholder="Ex. John Doe"
              />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={settings.userEmail} 
                onChange={(e) => handleChange("userEmail", e.target.value)}
                placeholder="Ex. john@example.com"
              />
            </div>
          </div>
        </section>

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
                <option value="dark">OLED Dark (Pure Black)</option>
                <option value="creamy">Warm Creamy (Beige)</option>
                <option value="modern">Modern Space (Indigo)</option>
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
                  transition: "background 0.3s ease"
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
                  transition: "background 0.3s ease"
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
                  transition: "background 0.3s ease"
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
                  background: settings.experimental ? "#ec4899" : "var(--surface-light)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.3s ease"
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
          </div>
        </section>

        {/* Save Bar */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "20px 32px",
          background: "rgba(15, 13, 35, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          position: "sticky",
          bottom: 24,
          zIndex: 10
        }}>
          <div style={{ color: "var(--accent-light)", fontWeight: 500, fontSize: 14 }}>
            {saveStatus ? "✓ " + saveStatus : "Unsaved changes detect automatically..."}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button 
              className="btn-secondary" 
              style={{ padding: "10px 24px", fontSize: 14 }}
              onClick={() => {
                const saved = localStorage.getItem("artius_settings");
                if (saved) setSettings(JSON.parse(saved));
              }}
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
    </div>
  );
}
