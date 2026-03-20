"use client";
import { useState, useEffect } from "react";
import TemplateCard from "../components/TemplateCard";
import TemplateModal from "../components/TemplateModal";

interface Template {
  id: string;
  name: string;
  description: string;
  accent_color: string;
  features: string[];
  category: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE}/api/templates`)
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates);
        setLoading(false);
      })
      .catch(() => {
        // Fallback data if backend is not running
        const fallbackTemplates: any[] = [
          {
            id: "classic",
            name: "Classic Elegance",
            description: "A sophisticated two-column template perfect for experienced professionals. Features a sharp navy header with gold typography, and clean multi-column sections.",
            accent_color: "#1e293b",
            features: ["Two-column layout", "ATS-friendly", "Elegant typography", "Professional Header"],
            category: "Professional"
          }
        ];
        setTemplates(fallbackTemplates);
        setLoading(false);
      });
  }, []);

  const categories = ["All", ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === "All"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "120px 56px 80px",
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: 20,
          background: "rgba(99, 102, 241, 0.08)",
          color: "var(--accent-light)",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 20,
          border: "1px solid var(--border)"
        }}>
          ✦ Premium Library
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            marginBottom: 16,
            background: "linear-gradient(135deg, #fff, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "var(--font-playfair)"
          }}
        >
          Select Your Professional Foundation
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 600, margin: "0 auto 24px" }}>
          Each template is precision-engineered for maximum impact, readability, and ATS compatibility across all industries.
        </p>

        {/* Category Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "btn-primary" : "btn-secondary"}
              style={{ padding: "10px 24px", fontSize: 13, borderRadius: 30 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 100 }}>
          <div className="animate-float" style={{ fontSize: 40 }}>🎨</div>
          <p style={{ color: "var(--text-muted)", marginTop: 20 }}>Refining templates...</p>
        </div>
      ) : (
        <div
          className="animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 32,
            animationDelay: "0.2s",
          }}
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={setSelectedTemplate}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
