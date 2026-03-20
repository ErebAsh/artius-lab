"use client";
import React, { useState, useEffect, useRef } from "react";

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
  const [dynamicHeight, setDynamicHeight] = useState("297mm");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const execFormat = (command: string, value?: string) => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    iframeRef.current.contentDocument.execCommand(command, false, value);
    iframeRef.current.contentWindow?.focus();
  };

  const updateIframeLayout = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    
    let style = doc.getElementById('layout-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'layout-style';
      doc.head.appendChild(style);
    }
    
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
    `;
  };

  useEffect(() => {
    if (previewHtml) {
      setTimeout(updateIframeLayout, 100);
    }
  }, [layout, previewHtml]);

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
            style={{ ...toolbarButtonStyle, background: "rgba(99, 102, 241, 0.2)", height: 40 }} 
            title="Print"
          >
            ⎙
          </button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
          <button 
            onClick={() => setShowLayoutPanel(!showLayoutPanel)} 
            style={{ ...toolbarButtonStyle, background: showLayoutPanel ? "var(--accent)" : "rgba(15, 23, 42, 0.5)", height: 44 }} 
            title="Layout Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </button>
        </div>

        {/* Expandable Layout Sidebar Panel */}
        {showLayoutPanel && (
          <div style={{
            position: "absolute",
            left: 84,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 101,
            width: 250,
            padding: 24,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            animation: "slideInRight 0.3s ease-out"
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" }}>Layout Settings</h3>
            
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
        )}

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
