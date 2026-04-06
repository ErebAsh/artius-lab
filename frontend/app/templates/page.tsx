"use client";
import { useState, useEffect } from "react";
import TemplateCard from "../components/TemplateCard";
import TemplateModal from "../components/TemplateModal";
import { useTheme } from "../components/ThemeProvider";


interface Template {
  id: string;
  name: string;
  description: string;
  accent_color: string;
  features: string[];
  category: string;
  has_latex?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TemplatesPage() {
  const { settings, updateSettings } = useTheme();
  const { selectedCategory, renderMode } = settings;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);


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
            id: "AL-004",
            name: "Navy Gold Corporate",
            description: "A sophisticated two-column template perfect for experienced professionals. Features a sharp navy header with gold typography, and clean multi-column sections.",
            accent_color: "#1e293b",
            features: ["Two-column layout", "ATS-friendly", "Elegant typography", "Professional Header"],
            category: "Professional",
            has_latex: true
          },
          {
            id: "AL-006",
            name: "Executive Pure White",
            description: "A clean, minimalist template with a crisp white sidebar and sophisticated typography. Perfect for corporate and executive roles.",
            accent_color: "#000000",
            features: ["White Sidebar", "Clean Divider", "Executive Typography", "Professional Layout"],
            category: "Executive",
            has_latex: true
          },
          {
            id: "AL-007",
            name: "Bold High Contrast",
            description: "A bold contrast template with a dark sidebar and elegant header. Features high-impact layout for marketing and consultant positions.",
            accent_color: "#333333",
            features: ["Dark Sidebar", "Contrast Header", "Modern Skills Bar", "High Impact"],
            category: "Creative",
            has_latex: true
          },
          {
            id: "AL-008",
            name: "Management Classic",
            description: "A classic sidebar template with sophisticated section dividers and a clean professional aesthetic. Perfect for management and client-facing roles.",
            accent_color: "#555555",
            features: ["Light Sidebar", "Section Dividers", "Modern Typography", "Professional Layout"],
            category: "Professional"
          },
          {
            id: "AL-009",
            name: "Beige Architectural",
            description: "A sophisticated palette of beige and charcoal with a bold header. Features a unique circular photo placement and structured expertise sections.",
            accent_color: "#5a5a5a",
            features: ["Dual-tone Header", "Circular Photo", "Beige Sidebar", "Structured Content"],
            category: "Modern"
          },
          {
            id: "AL-010",
            name: "Designer Soft Pink",
            description: "A clean, modern layout with soft pink accents and a strong focus on skills visualization. Ideal for designers and fashion industry professionals.",
            accent_color: "#f3e1e1",
            features: ["Soft Pink Sidebar", "Skill Progress Bars", "Modular Grid Header", "Elegant Layout"],
            category: "Creative"
          },
          {
            id: "AL-011",
            name: "Technical Navy Focus",
            description: "A powerful high-contrast design with a deep navy sidebar and timeline-based experience tracking. Perfect for technical leaders and engineers.",
            accent_color: "#002d44",
            features: ["Navy Sidebar", "Timeline Experience", "Language Proficiency Bars", "Technical Focus"],
            category: "Technical",
            has_latex: true
          },
          {
            id: "AL-012",
            name: "Vibrant Blue Accent",
            description: "A vibrant blue template with modern diagonal accents and Pill-shaped section headers. Features a clean timeline for education and experience.",
            accent_color: "#00adef",
            features: ["Blue Accents", "Pill Headers", "Timeline Layout", "Modern Icons"],
            category: "Modern"
          },
          {
            id: "AL-013",
            name: "Angular High Contrast",
            description: "A bold, angular design with high-contrast yellow and black themes. Perfect for creative directors and forward-thinking professionals.",
            accent_color: "#ffc107",
            features: ["Angular Design", "High Contrast", "Yellow Sidebar", "Modern Typography"],
            category: "Creative"
          },
          {
            id: "AL-014",
            name: "Grayscale Structural",
            description: "A sophisticated grayscale layout with a strong structural sidebar and integrated expertise sections. Great for designers and UI/UX specialists.",
            accent_color: "#444444",
            features: ["Grayscale Theme", "Structural Sidebar", "Skill Progress Bars", "Integrated Expertise"],
            category: "Modern"
          },
          {
            id: "AL-015",
            name: "Black Banner Executive",
            description: "A high-impact black-banner design with a clean right sidebar and elegant serif typography. Ideal for managers and creative directors.",
            accent_color: "#212121",
            features: ["Black Header Banner", "Right Sidebar", "Serif Typography", "Horizontal Skill Bars"],
            category: "Executive",
            has_latex: true
          },
          {
            id: "AL-016",
            name: "Hyper-Clean Minimalist",
            description: "A minimalist, hyper-clean template with generous whitespace and subtle dividers. Perfect for modern, sleek professional profiles.",
            accent_color: "#666666",
            features: ["Minimalist Design", "Clean Typography", "Subtle Dividers", "Whitespace Focused"],
            category: "Minimalist",
            has_latex: true
          },
          {
            id: "AL-017",
            name: "Purple Capsule Sidebar",
            description: "A striking dual-column design with a deep purple theme and capsule-shaped white sidebar. Features a bold and modern layout for freshes and professionals.",
            accent_color: "#4b2c5e",
            features: ["Deep Purple Theme", "Capsule Sidebar", "High Contrast", "Modern Icons"],
            category: "Modern"
          },
          {
            id: "AL-018",
            name: "Blue Logic Blocks",
            description: "A clean, contemporary layout with professional blue accent blocks and a strong emphasis on profile and skills. Ideal for tech and design roles.",
            accent_color: "#283593",
            features: ["Blue Accent Blocks", "Bold Header", "Two-column Layout", "Modern Typography"],
            category: "Modern"
          },
          {
            id: "AL-019",
            name: "Forest Green Angular",
            description: "A forest green design with beige accents and sharp angular section dividers. Excellent for candidates looking for a unique, nature-inspired professional look.",
            accent_color: "#1b431c",
            features: ["Forest Green Theme", "Beige Accents", "Angular Dividers", "Structured Profile"],
            category: "Modern"
          },
          {
            id: "AL-022",
            name: "Curved Header Modern",
            description: "A high-impact professional design with a dark sidebar, curved header, and vertical section navigation. Ideal for analysts and corporate roles.",
            accent_color: "#B35C1E",
            features: ["Dark Sidebar", "Curved Header", "Vertical Section Headers", "Photo Support"],
            category: "Modern"
          },
          {
            id: "AL-023",
            name: "Refined Typography Minimal",
            description: "A minimalist, elegant layout with a focus on typography and whitespace. Perfect for creative and corporate professionals seeking a refined look.",
            accent_color: "#1a1a1a",
            features: ["Minimalist Style", "Clean Typography", "Sidebar Layout", "Letter-spaced Headings"],
            category: "Minimalist",
            has_latex: true
          },
          {
            id: "AL-024",
            name: "Initials Badge Centered",
            description: "A modern centered design with a unique initials badge and a clean two-column structure. Ideal for designers and marketing professionals.",
            accent_color: "#000000",
            features: ["Centered Header", "Initials Badge", "Two-column Layout", "Circular Icons"],
            category: "Modern"
          },
          {
            id: "AL-025",
            name: "Script Font Elegant",
            description: "An elegant high-contrast template with horizontal bands and a stunning script font. Features a unique header layout and a clean split profile.",
            accent_color: "#EAE3D9",
            features: ["Horizontal Bands", "Script Typography", "Circular Photo", "Contrast Layout"],
            category: "Creative"
          },
          {
            id: "AL-026",
            name: "Navy Header Modern",
            description: "A professional two-column template with a dark navy header, initials badge, and a light gray sidebar. Features circular photo and skills visualization.",
            accent_color: "#2c3e50",
            features: ["Initials Badge", "Navy Header", "Circular Photo", "Skill Progress Dots"],
            category: "Modern"
          },
          {
            id: "AL-027",
            name: "Overlapping Block Layout",
            description: "A sophisticated cream and slate design with a unique overlapping square photo and strong architectural block structure.",
            accent_color: "#625f68",
            features: ["Overlapping Photo", "Cream Sidebar", "Slate Header Block", "Expertise Bullets"],
            category: "Creative"
          },
          {
            id: "AL-028",
            name: "Charcoal Beige Dual-tone",
            description: "A premium dual-tone design with a unique charcoal header block and initials badge. Features a structured beige sidebar and modern progress bars.",
            accent_color: "#3d3d3d",
            features: ["Initials Badge", "Dual-tone Header", "Beige Sidebar", "Skill Progress Bars"],
            category: "Modern"
          },
          {
            id: "AL-029",
            name: "Yellow Frame Contemporary",
            description: "A bold contemporary layout with large typography and a unique yellow photo frame. Perfect for creative and modern professional profiles.",
            accent_color: "#f7b42c",
            features: ["Yellow Photo Frame", "Large Typography", "Vertical Accent Bar", "Clean Footer"],
            category: "Creative"
          },
          {
            id: "AL-020",
            name: "Earth Tone Rounded",
            description: "A warm, sophisticated template with earthy brown tones and rounded card layouts. Perfect for artisanal and service-oriented professionals.",
            accent_color: "#9b846b",
            features: ["Earth Tones", "Rounded Layout", "Star Skill Ratings", "Elegant Cards"],
            category: "Modern"
          },
          {
            id: "AL-021",
            name: "Graphic Hex Red",
            description: "A high-impact design for creatives featuring a unique hexagon photo frame, bold red accents, and a rounded contrast sidebar.",
            accent_color: "#e74c3c",
            features: ["Hexagon Photo Frame", "Red Accents", "Rounded Sidebar", "High Contrast"],
            category: "Creative"
          },
          {
            id: "AL-030",
            name: "Navy Gold Architectural",
            description: "A premium two-column template with a dark navy sidebar and elegant gold accents. Features a clean architectural layout for high-level professionals.",
            accent_color: "#b49e85",
            features: ["Dark Sidebar", "Gold Accents", "Architectural Layout", "Professional Typography"],
            category: "Executive",
            has_latex: true
          },
          {
            id: "AL-031",
            name: "Black Gold Serif",
            description: "A sophisticated high-contrast template with a black sidebar and stunning gold serif typography. Features a circular profile photo and structured profile summary.",
            accent_color: "#c59d5f",
            features: ["Black Sidebar", "Gold Name Branding", "Circular Photo", "Elegant Serif Typography"],
            category: "Executive",
            has_latex: true
          },
          {
            id: "AL-032",
            name: "Beige Minimalist Slash",
            description: "A warm, modern template with a light beige sidebar and sharp minimalist typography. Features unique prefix-based headings and a clean structured layout.",
            accent_color: "#e6d5c8",
            features: ["Beige Sidebar", "Minimalist Typography", "Slash Headings", "Circular Photo"],
            category: "Minimalist"
          },
          {
            id: "AL-033",
            name: "Dual-tone Modern Manager",
            description: "An elegant template with a dual-tone header, beige accent line, and structured two-column content. Perfect for marketing and management roles.",
            accent_color: "#c3b091",
            features: ["Dual-tone Header", "Beige Accent line", "Light Gray Sidebar", "Clean Grid Layout"],
            category: "Modern"
          },
          {
            id: "AL-034",
            name: "Cream Tan Sidebar",
            description: "A sophisticated dual-tone template with a cream sidebar and elegant background-bar headers. Features a large circular photo and structured expertise sections.",
            accent_color: "#c1a182",
            features: ["Cream Sidebar", "Background-bar Headers", "Circular Photo", "Structured Expertise"],
            category: "Modern"
          },
          {
            id: "AL-035",
            name: "Deep Red Border Classic",
            description: "A classic professional template with deep red top and bottom borders, featuring a clean two-column layout and elegant serif typography. Perfect for corporate and executive roles.",
            accent_color: "#8B0000",
            features: ["Deep Red Borders", "Serif Typography", "Two-column Layout", "Professional Design"],
            category: "Professional",
            has_latex: true
          },
          {
            id: "AL-036",
            name: "Lavender Bar Modern",
            description: "A modern, sophisticated template with a unique lavender horizontal bar header and a clean structured layout. Ideal for administrative and management professionals.",
            accent_color: "#E8EAF6",
            features: ["Lavender Header Bar", "Structured Side Panel", "Clean Layout", "Modern Typography"],
            category: "Modern"
          },
          {
            id: "AL-037",
            name: "Neutral Grey Icon-Bar",
            description: "A minimalist, hyper-clean template with a neutral grey theme and integrated contact icon bar. Features a structured multi-section layout for experienced professionals.",
            accent_color: "#666666",
            features: ["Minimalist Grey Theme", "Contact Icon Bar", "Multi-section Sidebar", "Clean Architecture"],
            category: "Minimalist",
            has_latex: true
          },
          {
            id: "AL-038",
            name: "Horizontal Sidebar Bars",
            description: "A sophisticated two-column template with a circular profile photo and thick horizontal sidebar bars. Designed for clear professional history tracking and skills breakdown.",
            accent_color: "#ececec",
            features: ["Circular Profile Photo", "Horizontal Sidebar Bars", "Prefix-based Headings", "Dual-column Skills"],
            category: "Modern"
          }
        ];
        setTemplates(fallbackTemplates);
        setLoading(false);
      });
  }, []);

  const categoryOrder = ["All", "Professional", "Executive", "Modern", "Creative", "Minimalist", "Technical"];
  const categories = ["All", ...Array.from(new Set(templates.map(t => t.category)))].sort((a,b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesRenderMode = renderMode === "html" ? true : t.has_latex;
    return matchesCategory && matchesRenderMode;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "120px 56px 80px",
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      {/* Unified Premium Library & View Toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 56 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "4px",
          background: "var(--glow)",
          borderRadius: 40,
          border: "1px solid var(--border)",
          backdropFilter: "blur(8px)",
          gap: 4
        }}>
          {/* Static Branding Part */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px 8px 14px",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            userSelect: "none"
          }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Subtle background pulse aura */}
              <div 
                className="animate-pulse" 
                style={{ 
                  position: "absolute", 
                  width: 20, 
                  height: 20, 
                  background: "var(--accent)", 
                  opacity: 0.2, 
                  borderRadius: "50%", 
                  filter: "blur(8px)" 
                }} 
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" style={{ filter: "drop-shadow(0 0 8px var(--glow))", position: "relative" }}>
                <path d="M12 0L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 0Z" />
              </svg>
            </div>
            
            <span style={{ 
              background: "linear-gradient(90deg, var(--accent), var(--accent-light), var(--accent))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "inline-block",
              animation: "gradient-shift 4s linear infinite"
            }}>
              Premium Library
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />

          {/* Toggle Switches */}
          <div style={{ display: "flex", gap: 4, paddingRight: 4 }}>
            <button
              onClick={() => updateSettings({ renderMode: "html" })}

              style={{
                padding: "8px 18px",
                borderRadius: 30,
                border: "none",
                background: renderMode === "html" ? "var(--accent)" : "transparent",
                color: renderMode === "html" ? "#fff" : "var(--text-muted)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              HTML
            </button>
            <button
              onClick={() => updateSettings({ renderMode: "latex" })}

              style={{
                padding: "8px 18px",
                borderRadius: 30,
                border: "none",
                background: renderMode === "latex" ? "var(--accent)" : "transparent",
                color: renderMode === "latex" ? "#fff" : "var(--text-muted)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              LaTeX
            </button>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 32 }}>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            marginBottom: 16,
            background: "linear-gradient(135deg, var(--foreground), var(--accent-light))",
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
              onClick={() => updateSettings({ selectedCategory: cat })}

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
          
          {/* Professional Coming Soon Placeholder */}
          <div
            className="glass"
            style={{
              borderRadius: 16,
              aspectRatio: "1 / 1.414",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              textAlign: "center",
              border: "1px dashed var(--border)",
              background: "rgba(255,255,255,0.02)",
              opacity: 0.6
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "var(--foreground)" }}>
              Crafting New Standards
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 220 }}>
              I'm currently meticulously refining a new series of elite templates to ensure your professional story remains ahead of the trend.
            </p>
          </div>
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
