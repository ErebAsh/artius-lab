"use client";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description: string;
  accent_color: string;
  features: string[];
  category: string;
}

interface TemplateModalProps {
  template: Template;
  onClose: () => void;
}

export default function TemplateModal({ template, onClose }: TemplateModalProps) {
  const router = useRouter();

  const handleContinue = () => {
    router.push(`/builder?template=${template.id}`);
  };

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
            background: `linear-gradient(90deg, ${template.accent_color}, ${template.accent_color}80)`,
          }}
        />

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 20,
                background: `${template.accent_color}15`,
                color: template.accent_color,
                fontWeight: 500,
              }}
            >
              {template.category}
            </span>
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
                      background: `${template.accent_color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: template.accent_color,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
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
                background: `linear-gradient(135deg, ${template.accent_color}, ${template.accent_color}cc)`,
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
