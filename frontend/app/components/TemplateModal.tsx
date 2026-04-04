"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

interface Template {
  id: string;
  name: string;
  description: string;
  accent_color: string;
  features: string[];
  category: string;
  has_latex?: boolean;
}

interface TemplateModalProps {
  template: Template;
  onClose: () => void;
}

export default function TemplateModal({ template, onClose }: TemplateModalProps) {
  const router = useRouter();
  const { settings } = useTheme();
  const isLatexMode = settings.renderMode === "latex";

  const handleContinue = () => {
    router.push(`/builder?template=${template.id}`);
  };

  const accentGradient = isLatexMode && template.has_latex
    ? "linear-gradient(90deg, #89b4fa, #cba6f7)"
    : `linear-gradient(90deg, ${template.accent_color}, ${template.accent_color}80)`;

  const accentSolid = isLatexMode && template.has_latex
    ? "linear-gradient(135deg, #89b4fa, #cba6f7)"
    : `linear-gradient(135deg, ${template.accent_color}, ${template.accent_color}cc)`;

  const featureAccent = isLatexMode && template.has_latex ? "#89b4fa" : template.accent_color;

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 0, 20, 0.85)",
        backdropFilter: "blur(8px)",
        padding: 24,
      }}
    >
      <div
        className="glass animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* Header accent */}
        <div
          style={{
            height: 6,
            background: accentGradient,
          }}
        />

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* 1. Mode Badge (First) */}
              {isLatexMode && template.has_latex ? (
                <span
                  style={{
                    fontSize: 10,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: "linear-gradient(135deg, rgba(137, 180, 250, 0.15), rgba(203, 166, 247, 0.15))",
                    color: "#89b4fa",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    border: "1px solid rgba(137, 180, 250, 0.2)",
                  }}
                >
                  ✦ LATEX
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 10,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `${featureAccent}15`,
                    color: featureAccent,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    border: `1px solid ${featureAccent}30`,
                  }}
                >
                  ✦ HTML
                </span>
              )}

              {/* 2. Category Badge */}
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: 500,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {template.category}
              </span>

              {/* 3. Template ID Badge (Last) */}
              <span
                style={{
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontWeight: 600,
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  letterSpacing: "0.5px",
                }}
              >
                {template.id}
              </span>
            </div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginTop: 12,
                color: "var(--foreground)",
              }}
            >
              {template.name}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {template.description}
            </p>
          </div>

          {/* Features */}
          <div style={{ marginBottom: 28 }}>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Features
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {template.features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    color: "var(--foreground)",
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: `${featureAccent}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: featureAccent,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {feature}
                </div>
              ))}

              {/* Extra LaTeX-specific features */}
              {isLatexMode && template.has_latex && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "var(--foreground)",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: "rgba(137, 180, 250, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#89b4fa",
                        flexShrink: 0,
                      }}
                    >
                      ✦
                    </span>
                    LaTeX Source Export
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "var(--foreground)",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: "rgba(203, 166, 247, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#cba6f7",
                        flexShrink: 0,
                      }}
                    >
                      ✦
                    </span>
                    Overleaf / TeX Live Compatible
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleContinue}
              className="btn-primary"
              id="continue-with-template-btn"
              style={{
                flex: 1,
                background: accentSolid,
              }}
            >
              Continue with this template →
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: "14px 20px" }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
