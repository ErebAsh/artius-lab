"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface ResumeColors {
  accent: string;
  headings: string;
  bodyText: string;
  sidebarBg: string;
  linkColor: string;
}

const COLOR_PRESETS: { name: string; colors: ResumeColors }[] = [
  { name: "Default", colors: { accent: "", headings: "", bodyText: "", sidebarBg: "", linkColor: "" } },
  { name: "Navy Slate", colors: { accent: "#1e3a5f", headings: "#1e3a5f", bodyText: "#334155", sidebarBg: "#f0f4f8", linkColor: "#2563eb" } },
  { name: "Teal Coral", colors: { accent: "#0d9488", headings: "#134e4a", bodyText: "#374151", sidebarBg: "#f0fdfa", linkColor: "#f97316" } },
  { name: "Obsidian Cyan", colors: { accent: "#0891b2", headings: "#164e63", bodyText: "#1e293b", sidebarBg: "#ecfeff", linkColor: "#06b6d4" } },
  { name: "Plum Gold", colors: { accent: "#7c3aed", headings: "#4c1d95", bodyText: "#374151", sidebarBg: "#faf5ff", linkColor: "#f59e0b" } },
  { name: "Forest Amber", colors: { accent: "#15803d", headings: "#14532d", bodyText: "#374151", sidebarBg: "#f0fdf4", linkColor: "#d97706" } },
  { name: "Rose Steel", colors: { accent: "#be123c", headings: "#881337", bodyText: "#1f2937", sidebarBg: "#fff1f2", linkColor: "#e11d48" } },
  { name: "Midnight", colors: { accent: "#312e81", headings: "#1e1b4b", bodyText: "#1f2937", sidebarBg: "#eef2ff", linkColor: "#4f46e5" } },
  { name: "Warm Mocha", colors: { accent: "#78350f", headings: "#451a03", bodyText: "#44403c", sidebarBg: "#fef3c7", linkColor: "#92400e" } },
];

interface ResumeEditorProps {
  previewHtml: string;
  templateId: string;
  onExit: () => void;
  personal: { full_name: string };
  API_BASE: string;
  layout: {
    margin: number;
    fontSize: number;
    lineHeight: number;
    sectionGap: number;
    columnGap: number;
  };
  setLayout: (layout: any) => void;
}

const toolbarButtonStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "transparent",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 6,
  color: "#cbd5e1",
  cursor: "pointer",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
  height: 32,
  transition: "all 0.2s",
};

export default function ResumeEditor({
  previewHtml,
  templateId,
  onExit,
  personal,
  API_BASE,
  layout,
  setLayout
}: ResumeEditorProps) {
  const [zoom, setZoom] = useState(0.85);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState("297mm");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [resumeColors, setResumeColors] = useState<ResumeColors>({
    accent: "",
    headings: "",
    bodyText: "",
    sidebarBg: "",
    linkColor: "",
  });
  const [activePreset, setActivePreset] = useState("Default");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const execFormat = (command: string, value?: string) => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    iframeRef.current.contentDocument.execCommand(command, false, value);
    iframeRef.current.contentWindow?.focus();
  };

  const buildColorCSS = useCallback((colors: ResumeColors): string => {
    if (!colors.accent && !colors.headings && !colors.bodyText && !colors.sidebarBg && !colors.linkColor) {
      return '';
    }

    let css = '/* Color Customization Override */\n';

    if (colors.accent) {
      css += `
        /* Accent bars, borders, decorative elements */
        .top-accent, .header-bg-bar, .accent-bar, .header-accent,
        [class*="accent"], [class*="bar"] { background-color: ${colors.accent} !important; }
        .skill-bar-fill, .skill-dot, [class*="skill-bar-fill"], [class*="skill-dot"],
        [class*="progress-fill"], [class*="bar-fill"] { background: ${colors.accent} !important; background-color: ${colors.accent} !important; }
        .contact-icon, .contact-icon svg, [class*="contact-icon"] svg { fill: ${colors.accent} !important; color: ${colors.accent} !important; }
        .section-title, [class*="section-title"] { border-bottom-color: ${colors.accent} !important; }
        h2::after { background: ${colors.accent}55 !important; }
        .sidebar-section h3::after { background: ${colors.accent}55 !important; }
        .highlights li::before, .skills-list li::before { color: ${colors.accent} !important; }
        .item-list { list-style-type: disc !important; }
        .item-list li::marker { color: ${colors.accent} !important; }
      `;
    }

    if (colors.headings) {
      css += `
        /* Headings */
        h1, h2, h3, .section-title, .exp-title, .item-title, .project-title,
        .edu-degree, .sidebar-section h3,
        [class*="section-title"], [class*="exp-title"], [class*="item-title"] {
          color: ${colors.headings} !important;
        }
      `;
    }

    if (colors.bodyText) {
      css += `
        /* Body text */
        body, p, li, span, .profile-text, .exp-desc, .exp-meta, .item-desc,
        .summary-text, .project-desc, .edu-uni, .edu-date, .item-date,
        .item-subtitle, .contact-text, .skill-label span, .clean-list li,
        [class*="exp-desc"], [class*="item-desc"], [class*="contact-text"] {
          color: ${colors.bodyText} !important;
        }
      `;
    }

    if (colors.sidebarBg) {
      css += `
        /* Sidebar backgrounds */
        .right-sidebar, .sidebar, .left-sidebar, aside,
        [class*="sidebar"] {
          background-color: ${colors.sidebarBg} !important;
        }
        .header-bg-bar { background-color: ${colors.accent || colors.sidebarBg} !important; }
      `;
    }

    if (colors.linkColor) {
      css += `
        /* Links */
        a, .project-link, [class*="link"] {
          color: ${colors.linkColor} !important;
        }
      `;
    }

    return css;
  }, []);

  const updateIframeLayout = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    
    let style = doc.getElementById('layout-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'layout-style';
      doc.head.appendChild(style);
    }
    
    const colorCSS = buildColorCSS(resumeColors);

    style.textContent = `
      body { 
        font-size: ${layout.fontSize}pt !important; 
        line-height: ${layout.lineHeight} !important; 
      }
      .container { 
        padding-top: ${layout.margin}mm !important; 
        padding-bottom: ${layout.margin}mm !important;
        padding-left: ${layout.margin}mm !important;
        padding-right: ${layout.margin}mm !important;
        gap: ${layout.columnGap}px !important;
      }
      .section { 
        margin-bottom: ${layout.sectionGap}px !important; 
      }
      .right-column {
        padding-left: ${layout.columnGap}px !important;
      }
      ${colorCSS}
    `;
  }, [layout, resumeColors, buildColorCSS]);

  useEffect(() => {
    if (previewHtml) {
      setTimeout(updateIframeLayout, 100);
    }
  }, [layout, previewHtml, resumeColors, updateIframeLayout]);

  const handleDownloadPdf = async () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    setGenerating(true);
    setError("");

    try {
      const editedHtml = iframeRef.current.contentDocument.documentElement.outerHTML;
      const res = await fetch(`${API_BASE}/api/generate/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: editedHtml,
          filename: `${personal.full_name.replace(/\s/g, "_") || "Resume"}_Resume.pdf`
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "PDF download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${personal.full_name.replace(/\s/g, "_") || "Resume"}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      background: "#0a0a0f", 
      zIndex: 10000, 
      display: "flex", 
      flexDirection: "column",
      animation: "fadeIn 0.3s ease-out"
    }}>
      {/* Full Screen Header */}
      <div style={{ 
        position: "relative",
        padding: "16px 32px", 
        background: "rgba(15, 23, 42, 0.95)", 
        backdropFilter: "blur(12px)", 
        borderBottom: "1px solid rgba(255,255,255,0.15)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        boxShadow: "0 4px 25px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button 
            onClick={onExit}
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.15)", 
              color: "#fff", 
              padding: "10px 16px", 
              borderRadius: 10, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.3s"
            }}
            className="hover:bg-red-500/20"
          >
            ✕ Exit Editor
          </button>
        </div>

        {/* Centered Title Area */}
        <div style={{ 
          position: "absolute", 
          left: "50%", 
          top: "50%", 
          transform: "translate(-50%, -50%)", 
          textAlign: "center" 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 1 }}>MANUAL RESUME EDITOR</h2>
          <p style={{ fontSize: 11, color: "var(--accent-light)", margin: 0, fontWeight: 700, letterSpacing: 1 }}>{templateId.toUpperCase()} TEMPLATE • LIVE PREVIEW</p>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleDownloadPdf} 
          disabled={generating}
          style={{ padding: "12px 28px", fontSize: 15, fontWeight: 700, boxShadow: "0 10px 20px -3px rgba(99,102,241,0.4)" }}
        >
          {generating ? "Saving..." : "↓ Download PDF"}
        </button>
      </div>

      {/* Workspace Container */}
      <div style={{ position: "relative", flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Floating Left Toolbar (View & Zoom) */}
        <div style={{ 
          position: "absolute", 
          left: 24, 
          top: "50%", 
          transform: "translateY(-50%)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 10px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(16px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
        }}>
          <button onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))} style={toolbarButtonStyle} title="Zoom In">＋</button>
          <div style={{ fontSize: 11, color: "#fff", textAlign: "center", fontWeight: 800, padding: "4px 0" }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))} style={toolbarButtonStyle} title="Zoom Out">－</button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button 
            onClick={() => {
              const win = iframeRef.current?.contentWindow;
              if (win) { win.focus(); win.print(); }
            }} 
            style={{ 
              ...toolbarButtonStyle, 
              background: "rgba(99, 102, 241, 0.15)", 
              height: 40,
              borderColor: "rgba(99, 102, 241, 0.3)"
            }} 
            title="Print"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button 
            onClick={() => { setShowLayoutPanel(!showLayoutPanel); setShowColorPanel(false); }} 
            style={{ 
              ...toolbarButtonStyle, 
              background: showLayoutPanel ? "linear-gradient(135deg, #3b82f6, #1e40af)" : "rgba(15, 23, 42, 0.5)", 
              height: 44,
              boxShadow: showLayoutPanel ? "0 0 15px rgba(59, 130, 246, 0.5)" : undefined,
              borderColor: showLayoutPanel ? "#60a5fa" : "rgba(255,255,255,0.1)"
            }} 
            title="Layout Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
          </button>
          <button 
            onClick={() => { setShowColorPanel(!showColorPanel); setShowLayoutPanel(false); }} 
            className="awesome-color-btn"
            style={{ 
              ...toolbarButtonStyle, 
              height: 44, 
              border: "none",
              background: showColorPanel ? "conic-gradient(from 0deg, #ff4545, #ffa045, #ffff45, #45ff45, #45ffff, #4545ff, #ff45ff, #ff4545)" : undefined,
              boxShadow: showColorPanel ? "0 0 15px rgba(255,255,255,0.3)" : undefined
            }} 
            title="Color Customization"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="white"/>
              <circle cx="17.5" cy="10.5" r=".5" fill="white"/>
              <circle cx="8.5" cy="7.5" r=".5" fill="white"/>
              <circle cx="6.5" cy="12.5" r=".5" fill="white"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.607-.482 1.926-1.185.319-.704.116-1.503-.393-2.012l-.218-.219c-.51-.51-.611-1.285-.256-1.926.355-.64 1.127-.923 1.834-.783h.111c3.15 0 6.004-2.222 6.004-5.836C21 5.42 16.963 2 12 2z"/>
            </svg>
          </button>
        </div>

        <div 
          className={`custom-scrollbar panel-animate ${showLayoutPanel ? 'open' : ''}`}
          style={{
            position: "absolute",
            left: 84,
            top: "50%",
            zIndex: 101,
            width: 320,
            maxHeight: "70vh",
            overflowY: "auto",
            padding: "20px 24px",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>Layout Settings</h3>
            <button 
              onClick={() => setLayout({ margin: 24, fontSize: 11, lineHeight: 1.5, sectionGap: 24, columnGap: 30 })}
              style={{ fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}
            >Reset</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Margins ({layout.margin}mm)</label>
              </div>
              <input type="range" min="10" max="40" value={layout.margin} onChange={(e) => setLayout({...layout, margin: parseInt(e.target.value)})} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Font Size ({layout.fontSize}pt)</label>
              </div>
              <input type="range" min="8" max="14" step="0.5" value={layout.fontSize} onChange={(e) => setLayout({...layout, fontSize: parseFloat(e.target.value)})} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Line Spacing ({layout.lineHeight})</label>
              </div>
              <input type="range" min="1" max="2" step="0.1" value={layout.lineHeight} onChange={(e) => setLayout({...layout, lineHeight: parseFloat(e.target.value)})} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Section Gap ({layout.sectionGap}px)</label>
              </div>
              <input type="range" min="10" max="60" value={layout.sectionGap} onChange={(e) => setLayout({...layout, sectionGap: parseInt(e.target.value)})} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Column Gap ({layout.columnGap}px)</label>
              </div>
              <input type="range" min="10" max="60" value={layout.columnGap} onChange={(e) => setLayout({...layout, columnGap: parseInt(e.target.value)})} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>
          </div>
        </div>

        {/* Expandable Color Customization Panel */}
        <div 
          className={`custom-scrollbar panel-animate ${showColorPanel ? 'open' : ''}`}
          style={{
            position: "absolute",
            left: 84,
            top: "50%",
            zIndex: 101,
            width: 380,
            maxHeight: "68vh",
            overflowY: "auto",
            padding: "20px 24px",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>🎨 Color Theme</h3>
            <button 
              onClick={() => { setResumeColors({ accent: "", headings: "", bodyText: "", sidebarBg: "", linkColor: "" }); setActivePreset("Default"); }}
              style={{ fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}
            >Reset</button>
          </div>

          {/* Preset Palettes */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 10 }}>Quick Presets</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { setResumeColors(preset.colors); setActivePreset(preset.name); }}
                  style={{
                    padding: "6px 8px",
                    background: activePreset === preset.name ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.03)",
                    border: activePreset === preset.name ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: activePreset === preset.name ? "#c7d2fe" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {preset.colors.accent ? (
                    <div style={{ display: "flex", gap: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: preset.colors.accent, border: "1px solid rgba(255,255,255,0.2)" }} />
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: preset.colors.headings, border: "1px solid rgba(255,255,255,0.2)" }} />
                    </div>
                  ) : (
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg, #ccc, #888)", border: "1px solid rgba(255,255,255,0.2)" }} />
                  )}
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 14px" }} />

          {/* Individual Color Pickers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: -4 }}>Custom Colors</label>

            {/* Accent Color */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: resumeColors.accent || "#6366f1", display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Accent / Bars
                </label>
                {resumeColors.accent && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{resumeColors.accent}</span>}
              </div>
              <input type="color" value={resumeColors.accent || "#6366f1"} onChange={(e) => { setResumeColors({ ...resumeColors, accent: e.target.value }); setActivePreset(""); }} style={{ width: "100%", height: 32, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
            </div>

            {/* Headings Color */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: resumeColors.headings || "#1e293b", display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Headings
                </label>
                {resumeColors.headings && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{resumeColors.headings}</span>}
              </div>
              <input type="color" value={resumeColors.headings || "#1e293b"} onChange={(e) => { setResumeColors({ ...resumeColors, headings: e.target.value }); setActivePreset(""); }} style={{ width: "100%", height: 32, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
            </div>

            {/* Body Text Color */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: resumeColors.bodyText || "#374151", display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Body Text
                </label>
                {resumeColors.bodyText && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{resumeColors.bodyText}</span>}
              </div>
              <input type="color" value={resumeColors.bodyText || "#374151"} onChange={(e) => { setResumeColors({ ...resumeColors, bodyText: e.target.value }); setActivePreset(""); }} style={{ width: "100%", height: 32, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
            </div>

            {/* Sidebar Background */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: resumeColors.sidebarBg || "#f8fafc", display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Sidebar BG
                </label>
                {resumeColors.sidebarBg && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{resumeColors.sidebarBg}</span>}
              </div>
              <input type="color" value={resumeColors.sidebarBg || "#f8fafc"} onChange={(e) => { setResumeColors({ ...resumeColors, sidebarBg: e.target.value }); setActivePreset(""); }} style={{ width: "100%", height: 32, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
            </div>

            {/* Link Color */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: resumeColors.linkColor || "#3b82f6", display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Links
                </label>
                {resumeColors.linkColor && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{resumeColors.linkColor}</span>}
              </div>
              <input type="color" value={resumeColors.linkColor || "#3b82f6"} onChange={(e) => { setResumeColors({ ...resumeColors, linkColor: e.target.value }); setActivePreset(""); }} style={{ width: "100%", height: 32, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
            </div>
          </div>

          <p style={{ fontSize: 10, color: "#64748b", marginTop: 16, lineHeight: 1.5, fontStyle: "italic" }}>
            Colors are applied live and will be included in the PDF export.
          </p>
        </div>

        {/* Floating Right Toolbar (Editing) */}
        <div style={{ 
          position: "absolute", 
          right: 24, 
          top: "50%", 
          transform: "translateY(-50%)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 10px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(16px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
        }}>
          <button onClick={() => execFormat('bold')} style={toolbarButtonStyle} title="Bold"><b>B</b></button>
          <button onClick={() => execFormat('italic')} style={toolbarButtonStyle} title="Italic"><i>I</i></button>
          <button onClick={() => execFormat('underline')} style={toolbarButtonStyle} title="Underline"><u>U</u></button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button onClick={() => execFormat('insertUnorderedList')} style={toolbarButtonStyle} title="Bullet List">•</button>
          <button onClick={() => execFormat('insertOrderedList')} style={toolbarButtonStyle} title="Numbered List">1.</button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button onClick={() => execFormat('justifyLeft')} style={toolbarButtonStyle} title="Align Left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </button>
          <button onClick={() => execFormat('justifyCenter')} style={toolbarButtonStyle} title="Align Center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
          </button>
          <button onClick={() => execFormat('justifyRight')} style={toolbarButtonStyle} title="Align Right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button onClick={() => execFormat('undo')} style={toolbarButtonStyle} title="Undo">↶</button>
          <button onClick={() => execFormat('redo')} style={toolbarButtonStyle} title="Redo">↷</button>
        </div>

        {/* Main Content Area */}
        <div className="custom-scrollbar" style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "80px 40px", 
          display: "flex", 
          justifyContent: "center",
          background: "var(--background)",
          backgroundImage: `
            radial-gradient(var(--accent-light) 0.5px, transparent 0.5px),
            radial-gradient(var(--accent-light) 0.2px, transparent 0.2px)
          `,
          opacity: 1,
          backgroundSize: "64px 64px, 32px 32px",
          backgroundBlendMode: "overlay",
          scrollBehavior: "smooth"
        }}>
        <div style={{ 
          position: "relative",
          width: "210mm",
          height: dynamicHeight,
          minHeight: "297mm",
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          marginBottom: "120px",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {/* Immersive Border Identification */}
          <div style={{
            position: "absolute",
            inset: -6,
            border: "2px solid var(--accent)",
            borderRadius: 4,
            pointerEvents: "none",
            opacity: 0.5,
            boxShadow: "0 0 50px rgba(0, 0, 0, 0.5), 0 0 15px var(--glow)"
          }} />
          
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            style={{
              width: "210mm",
              height: dynamicHeight,
              minHeight: "297mm",
              border: "none",
              background: "white",
              boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255,255,255,0.1)",
              display: "block",
              transition: "height 0.25s ease-out"
            }}
            onLoad={(e) => {
              const doc = (e.target as HTMLIFrameElement).contentDocument;
              if (doc) {
                doc.body.contentEditable = "true";
                doc.body.style.outline = "none";
                doc.body.style.margin = "0";
                doc.body.style.padding = "0";
                doc.body.style.backgroundColor = "white";
                doc.body.style.cursor = "text";
                doc.body.style.overflow = "hidden";
                
                const style = doc.createElement('style');
                style.textContent = `
                  body { 
                    overflow-x: hidden; 
                    width: 210mm; 
                  }
                  * { cursor: text !important; }
                  a { cursor: pointer !important; text-decoration: none; color: inherit; }
                  @page { margin: 0; size: A4; }
                `;
                doc.head.appendChild(style);

                const updateH = () => {
                  if (doc.documentElement) {
                    const h = doc.documentElement.scrollHeight;
                    setDynamicHeight(`${h}px`);
                  }
                };
                setTimeout(updateH, 150);
                if (typeof ResizeObserver !== 'undefined') {
                  new ResizeObserver(updateH).observe(doc.body);
                }
                updateIframeLayout();
              }
            }}
          />
        </div>
      </div>
    </div>
      
      <div style={{ padding: "10px 32px", background: "var(--background)", color: "var(--text-muted)", fontSize: 12, textAlign: "center", fontWeight: 600, borderTop: "1px solid var(--border)" }}>
        Standard A4 Canvas Mode (Print Optimized) • WYSIWYG Resume Editor Engine
      </div>
      {error && (
        <div style={{ position: "fixed", bottom: 20, right: 20, background: "#ef4444", color: "#fff", padding: "12px 20px", borderRadius: 8, zIndex: 11000 }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 10, background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
