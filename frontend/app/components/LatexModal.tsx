"use client";
import React, { useState } from "react";
import { Copy, Check, Download, ExternalLink, Code, X, Loader2 } from "lucide-react";

interface LatexModalProps {
  isOpen: boolean;
  onClose: () => void;
  latexCode: string;
  loading: boolean;
  error?: string;
  filename?: string;
}

export default function LatexModal({
  isOpen,
  onClose,
  latexCode,
  loading,
  error,
  filename = "Resume.tex",
}: LatexModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = latexCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexCode], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".tex") ? filename : `${filename}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInOverleaf = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.overleaf.com/docs";
    form.target = "_blank";

    const snipInput = document.createElement("input");
    snipInput.type = "hidden";
    snipInput.name = "snip";
    snipInput.value = latexCode;

    const nameInput = document.createElement("input");
    nameInput.type = "hidden";
    nameInput.name = "snip_name";
    nameInput.value = filename.endsWith(".tex") ? filename : `${filename}.tex`;

    form.appendChild(snipInput);
    form.appendChild(nameInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const lineCount = latexCode ? latexCode.split("\n").length : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(10px)",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: "#0d1117",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99, 102, 241, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(22, 27, 34, 0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Code size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f0f6fc", display: "flex", alignItems: "center", gap: 8 }}>
                LaTeX Studio Source
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  .tex
                </span>
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8b949e" }}>
                Ready for Overleaf, TeXLive, or MacTeX compilation ({lineCount} lines)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleCopy}
              disabled={loading || !latexCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: copied ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.08)",
                border: copied ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                color: copied ? "#4ade80" : "#e6edf3",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>

            <button
              onClick={handleDownloadTex}
              disabled={loading || !latexCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e6edf3",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Download .tex file"
            >
              <Download size={16} />
              Download .tex
            </button>

            <button
              onClick={handleOpenInOverleaf}
              disabled={loading || !latexCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.2s",
              }}
              title="Open project directly in Overleaf"
            >
              <ExternalLink size={16} />
              Open in Overleaf
            </button>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b949e",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: "420px" }}>
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                background: "rgba(13, 17, 23, 0.9)",
                zIndex: 10,
              }}
            >
              <Loader2 size={36} className="animate-spin text-indigo-400" />
              <p style={{ margin: 0, color: "#8b949e", fontSize: "14px" }}>
                Rendering LaTeX template...
              </p>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#f85149",
                background: "rgba(248, 81, 73, 0.1)",
                margin: "24px",
                borderRadius: "12px",
                border: "1px solid rgba(248, 81, 73, 0.3)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div
              style={{
                height: "100%",
                maxHeight: "calc(90vh - 120px)",
                overflowY: "auto",
                padding: "16px 20px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
                lineHeight: "1.6",
                color: "#e6edf3",
                background: "#090d13",
              }}
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                <code>{latexCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

