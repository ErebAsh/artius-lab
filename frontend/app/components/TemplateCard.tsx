"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    accent_color: string;
    features: string[];
    category: string;
    has_latex?: boolean;
  };
  onSelect: (template: TemplateCardProps["template"]) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { settings } = useTheme();
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  const isLatexMode = settings.renderMode === "latex";

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / 800);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="glass"
      id={`template-card-${template.id}`}
      onClick={() => onSelect(template)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 20px 60px ${isLatexMode && template.has_latex ? "rgba(137,180,250,0.3)" : `${template.accent_color}30`}`
          : "none",
      }}
    >
      {/* Template Preview — always uses HTML iframe for thumbnail */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          aspectRatio: "1 / 1.414",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Template Badge */}
        {template.has_latex && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 30,
              background: isLatexMode
                ? "linear-gradient(135deg, rgba(137, 180, 250, 0.95), rgba(203, 166, 247, 0.95))"
                : "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              border: isLatexMode
                ? "1px solid rgba(137, 180, 250, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: isLatexMode
                ? "0 4px 16px rgba(137, 180, 250, 0.35)"
                : "0 4px 12px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ color: isLatexMode ? "#fff" : "#00adef" }}>✦</span>
            {isLatexMode ? "LaTeX" : "LaTeX Ready"}
          </div>
        )}

        {/* HTML iframe preview (used for BOTH HTML and LaTeX modes as thumbnail) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "800px",
            height: "1131px",
            transform: `scale(${scale * (hovered ? 1.05 : 1)})`,
            transformOrigin: "top left",
            transition: "transform 0.4s",
            pointerEvents: "none",
            backgroundColor: "#fff",
          }}
        >
          <iframe
            src={`${API_BASE}/api/templates/${template.id}/preview`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            scrolling="no"
          />
        </div>

        {/* LaTeX mode overlay effect — subtle tint over the HTML preview */}
        {isLatexMode && template.has_latex && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 15,
              pointerEvents: "none",
              background: "linear-gradient(180deg, transparent 0%, transparent 85%, rgba(30, 30, 46, 0.6) 100%)",
            }}
          >
            {/* LaTeX overlay label at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "16px 14px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.85)",
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                }}
              >
                {`\\documentclass{article}`}
              </span>
            </div>
          </div>
        )}

        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: isLatexMode && template.has_latex
              ? "linear-gradient(90deg, #89b4fa, #cba6f7)"
              : template.accent_color,
            zIndex: 10,
          }}
        />

        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isLatexMode && template.has_latex
              ? "linear-gradient(135deg, rgba(137, 180, 250, 0.15), rgba(203, 166, 247, 0.25))"
              : `linear-gradient(135deg, ${template.accent_color}20, ${template.accent_color}40)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s",
            zIndex: 20,
          }}
        >
          <span
            style={{
              padding: "10px 24px",
              background: isLatexMode && template.has_latex
                ? "linear-gradient(135deg, #89b4fa, #cba6f7)"
                : template.accent_color,
              color: "#fff",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              transform: hovered ? "translateY(0)" : "translateY(10px)",
              transition: "transform 0.3s",
            }}
          >
            {isLatexMode ? "Use LaTeX Template" : "Preview Template"}
          </span>
        </div>
      </div>
    </div>
  );
}
