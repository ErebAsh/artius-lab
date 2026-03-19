"use client";
import { useState } from "react";
import Image from "next/image";
interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    accent_color: string;
    features: string[];
    category: string;
  };
  onSelect: (template: TemplateCardProps["template"]) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);

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
          ? `0 20px 60px ${template.accent_color}30`
          : "none",
      }}
    >
      {/* Template Preview */}
      <div
        style={{
          position: "relative",
          height: 220,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Actual resume image */}
        <Image
          src={`/images/${template.id}.png`}
          alt={`${template.name} preview`}
          fill
          style={{
            objectFit: "cover",
            objectPosition: "top",
            transition: "transform 0.4s",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: template.accent_color,
            zIndex: 10,
          }}
        />

        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${template.accent_color}20, ${template.accent_color}40)`,
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
              background: template.accent_color,
              color: "#fff",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              transform: hovered ? "translateY(0)" : "translateY(10px)",
              transition: "transform 0.3s",
            }}
          >
            Preview Template
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div style={{ padding: "16px 20px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {template.name}
          </h3>
          <span
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 20,
              background: `${template.accent_color}15`,
              color: template.accent_color,
              fontWeight: 500,
            }}
          >
            {template.category}
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {template.description}
        </p>
      </div>
    </div>
  );
}
