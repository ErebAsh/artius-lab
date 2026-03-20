"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

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
          ? `0 20px 60px ${template.accent_color}30`
          : "none",
      }}
    >
      {/* Template Preview */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          aspectRatio: "1 / 1.414",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Auto Thumbnail using iframe */}
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
    </div>
  );
}
