"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingOverlay from "../components/LoadingOverlay";
import ResumeEditor from "./ResumeEditor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = [
  { id: 0, label: "Personal Info", icon: "👤" },
  { id: 1, label: "Education", icon: "🎓" },
  { id: 2, label: "Experience", icon: "💼" },
  { id: 3, label: "Skills", icon: "⚡" },
  { id: 4, label: "Projects", icon: "🚀" },
  { id: 5, label: "Layout & Style", icon: "📐" },
];

interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  achievements: string;
}

interface Experience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  highlights: string[];
}

interface Skill {
  name: string;
  level: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link: string;
}

function BuilderContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") || "modern";

  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const [error, setError] = useState("");
  const [layout, setLayout] = useState({
    margin: 24,         // mm
    fontSize: 11,      // pt
    lineHeight: 1.5,   // unitless
    sectionGap: 24,    // px
    columnGap: 30,     // px
  });

  useEffect(() => {
    if (previewHtml) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [previewHtml]);

  // Form state
  const [personal, setPersonal] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    summary: "",
  });

  const [education, setEducation] = useState<Education[]>([
    { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", achievements: "" },
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    { company: "", title: "", start_date: "", end_date: "", description: "", highlights: [""] },
  ]);

  const [skills, setSkills] = useState<Skill[]>([
    { name: "", level: "Intermediate" },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { name: "", description: "", technologies: [""], link: "" },
  ]);

  const handleAIAutoComplete = async () => {
    setEnhancing(true);
    setError("");

    const resumeData = {
      template_id: templateId,
      personal_info: personal,
      education: education.filter((e) => e.institution.trim() !== ""),
      experience: experience.filter((e) => e.company.trim() !== ""),
      skills: skills.filter((s) => s.name.trim() !== ""),
      projects: projects.filter((p) => p.name.trim() !== ""),
    };

    try {
      const res = await fetch(`${API_BASE}/api/ai/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "AI completion failed");
      }

      const data = await res.json();
      const enhanced = data.enhanced_data;
      const layoutSettings = data.layout_settings;

      if (enhanced.personal_info) {
        setPersonal((prev) => ({ ...prev, ...enhanced.personal_info }));
      }
      if (enhanced.education && enhanced.education.length > 0) {
        setEducation(enhanced.education);
      }
      if (enhanced.experience && enhanced.experience.length > 0) {
        setExperience(enhanced.experience);
      }
      if (enhanced.skills && enhanced.skills.length > 0) {
        setSkills(enhanced.skills);
      }
      if (enhanced.projects && enhanced.projects.length > 0) {
        setProjects(enhanced.projects);
      }

      // Automatically apply AI-suggested layout
      if (layoutSettings) {
        setLayout((prev) => ({
          margin: layoutSettings.margin || prev.margin,
          fontSize: layoutSettings.fontSize || prev.fontSize,
          lineHeight: layoutSettings.lineHeight || prev.lineHeight,
          sectionGap: layoutSettings.sectionGap || prev.sectionGap,
          columnGap: layoutSettings.columnGap || prev.columnGap,
        }));
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI completion failed. Please try again.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleGeneratePreview = async () => {
    setGenerating(true);
    setError("");

    const resumeData = {
      template_id: templateId,
      personal_info: personal,
      education: education.filter((e) => e.institution.trim() !== ""),
      experience: experience.filter((e) => e.company.trim() !== ""),
      skills: skills.filter((s) => s.name.trim() !== ""),
      projects: projects.filter((p) => p.name.trim() !== ""),
    };

    try {
      const res = await fetch(`${API_BASE}/api/generate/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Generation failed");
      }

      const { html, layout_settings: layoutSettings } = await res.json();
      setPreviewHtml(html);
      
      if (layoutSettings) {
        setLayout((prev) => ({
          margin: layoutSettings.margin || prev.margin,
          fontSize: layoutSettings.fontSize || prev.fontSize,
          lineHeight: layoutSettings.lineHeight || prev.lineHeight,
          sectionGap: layoutSettings.sectionGap || prev.sectionGap,
          columnGap: layoutSettings.columnGap || prev.columnGap,
        }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--foreground)",
    fontSize: 14,
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-muted)",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  const addBtnStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px dashed var(--accent)",
    borderRadius: 10,
    color: "var(--accent-light)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "all 0.3s",
  };

  const removeBtnStyle: React.CSSProperties = {
    padding: "6px 14px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    color: "#ef4444",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
  };

  // --- MANUAL EDITOR VIEW ---
  if (previewHtml) {
    return (
      <ResumeEditor 
        previewHtml={previewHtml}
        templateId={templateId}
        onExit={() => setPreviewHtml(null)}
        personal={personal}
        API_BASE={API_BASE}
        layout={layout}
        setLayout={setLayout}
      />
    );
  }

  // --- MAIN BUILDER VIEW ---
  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 840, margin: "0 auto" }}>
      {generating && <LoadingOverlay />}

      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 8, background: "linear-gradient(135deg, #fff, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Build Your Resume
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, fontWeight: 500, letterSpacing: 0.5 }}>
            Active Template: <span style={{ color: "var(--accent-light)", fontWeight: 700, textTransform: "uppercase" }}>{templateId}</span>
          </p>
          <Link 
            href="/templates" 
            style={{ 
              fontSize: 10, 
              fontWeight: 800, 
              textDecoration: "none", 
              color: "rgba(255,255,255,0.4)",
              padding: "4px 12px",
              borderRadius: 30,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "uppercase",
              letterSpacing: 1,
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
            className="hover:bg-accent-light/10 hover:text-accent-light hover:border-accent-light/40 hover:-translate-y-0.5"
          >
            Change
          </Link>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="glass animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", borderRadius: 14, marginBottom: 32, animationDelay: "0.1s" }}>
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: "none", background: currentStep === step.id ? "rgba(99, 102, 241, 0.15)" : "transparent", color: currentStep === step.id ? "var(--accent-light)" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: currentStep === step.id ? 600 : 400, transition: "all 0.3s" }}
          >
            <span>{step.icon}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="glass animate-fade-in-up" style={{ padding: "32px 36px", borderRadius: 18, animationDelay: "0.2s" }}>
        {currentStep === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Personal Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="John Doe" value={personal.full_name} onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="john@example.com" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="+1 234 567 890" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input style={inputStyle} placeholder="San Francisco, CA" value={personal.location} onChange={(e) => setPersonal({ ...personal, location: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn</label>
                <input style={inputStyle} placeholder="linkedin.com/in/johndoe" value={personal.linkedin} onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Portfolio</label>
                <input style={inputStyle} placeholder="johndoe.dev" value={personal.portfolio} onChange={(e) => setPersonal({ ...personal, portfolio: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Professional Summary</label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const }}
                placeholder="Briefly describe your professional background and key strengths..."
                value={personal.summary}
                onChange={(e) => setPersonal({ ...personal, summary: e.target.value })}
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Education</h2>
            {education.map((edu, idx) => (
              <div key={idx} style={{ padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-light)" }}>Education #{idx + 1}</span>
                  {education.length > 1 && (
                    <button style={removeBtnStyle} onClick={() => setEducation(education.filter((_, i) => i !== idx))}>Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Institution *</label>
                    <input style={inputStyle} placeholder="MIT" value={edu.institution} onChange={(e) => { const u = [...education]; u[idx].institution = e.target.value; setEducation(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Degree *</label>
                    <input style={inputStyle} placeholder="B.Tech" value={edu.degree} onChange={(e) => { const u = [...education]; u[idx].degree = e.target.value; setEducation(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Field of Study *</label>
                    <input style={inputStyle} placeholder="Computer Science" value={edu.field_of_study} onChange={(e) => { const u = [...education]; u[idx].field_of_study = e.target.value; setEducation(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>GPA</label>
                    <input style={inputStyle} placeholder="3.9/4.0" value={edu.gpa} onChange={(e) => { const u = [...education]; u[idx].gpa = e.target.value; setEducation(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input style={inputStyle} placeholder="Aug 2020" value={edu.start_date} onChange={(e) => { const u = [...education]; u[idx].start_date = e.target.value; setEducation(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input style={inputStyle} placeholder="May 2024" value={edu.end_date} onChange={(e) => { const u = [...education]; u[idx].end_date = e.target.value; setEducation(u); }} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Achievements</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} placeholder="Dean's List, scholarships..." value={edu.achievements} onChange={(e) => { const u = [...education]; u[idx].achievements = e.target.value; setEducation(u); }} />
                </div>
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => setEducation([...education, { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", achievements: "" }])}>
              + Add Education
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Work Experience</h2>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-light)" }}>Experience #{idx + 1}</span>
                  {experience.length > 1 && (
                    <button style={removeBtnStyle} onClick={() => setExperience(experience.filter((_, i) => i !== idx))}>Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <input style={inputStyle} placeholder="Google" value={exp.company} onChange={(e) => { const u = [...experience]; u[idx].company = e.target.value; setExperience(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Job Title *</label>
                    <input style={inputStyle} placeholder="Software Engineer" value={exp.title} onChange={(e) => { const u = [...experience]; u[idx].title = e.target.value; setExperience(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input style={inputStyle} placeholder="Jan 2022" value={exp.start_date} onChange={(e) => { const u = [...experience]; u[idx].start_date = e.target.value; setExperience(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input style={inputStyle} placeholder="Present" value={exp.end_date} onChange={(e) => { const u = [...experience]; u[idx].end_date = e.target.value; setExperience(u); }} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }} placeholder="Brief role description..." value={exp.description} onChange={(e) => { const u = [...experience]; u[idx].description = e.target.value; setExperience(u); }} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Key Highlights</label>
                  {exp.highlights.map((h, hi) => (
                    <div key={hi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={inputStyle} placeholder="Led a team of engineers..." value={h} onChange={(e) => { const u = [...experience]; u[idx].highlights[hi] = e.target.value; setExperience(u); }} />
                      {exp.highlights.length > 1 && (
                        <button style={{ ...removeBtnStyle, padding: "6px 10px" }} onClick={() => { const u = [...experience]; u[idx].highlights = u[idx].highlights.filter((_, i) => i !== hi); setExperience(u); }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button style={{ ...addBtnStyle, fontSize: 12, padding: "6px 14px" }} onClick={() => { const u = [...experience]; u[idx].highlights.push(""); setExperience(u); }}>+ Add Highlight</button>
                </div>
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => setExperience([...experience, { company: "", title: "", start_date: "", end_date: "", description: "", highlights: [""] }])}>
              + Add Experience
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Skills</h2>
            {skills.map((skill, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Skill Name</label>
                  <input style={inputStyle} placeholder="React, Python..." value={skill.name} onChange={(e) => { const u = [...skills]; u[idx].name = e.target.value; setSkills(u); }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Level</label>
                  <select style={{ ...inputStyle, appearance: "none" as const }} value={skill.level} onChange={(e) => { const u = [...skills]; u[idx].level = e.target.value; setSkills(u); }}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                {skills.length > 1 && (
                  <button style={{ ...removeBtnStyle, marginBottom: 2 }} onClick={() => setSkills(skills.filter((_, i) => i !== idx))}>✕</button>
                )}
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => setSkills([...skills, { name: "", level: "Intermediate" }])}>+ Add Skill</button>
          </div>
        )}

        {currentStep === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Projects</h2>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-light)" }}>Project #{idx + 1}</span>
                  {projects.length > 1 && (
                    <button style={removeBtnStyle} onClick={() => setProjects(projects.filter((_, i) => i !== idx))}>Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Project Name *</label>
                    <input style={inputStyle} placeholder="Internal Dashboard" value={proj.name} onChange={(e) => { const u = [...projects]; u[idx].name = e.target.value; setProjects(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Link</label>
                    <input style={inputStyle} placeholder="github.com/..." value={proj.link} onChange={(e) => { const u = [...projects]; u[idx].link = e.target.value; setProjects(u); }} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" as const }} placeholder="What does this project do?" value={proj.description} onChange={(e) => { const u = [...projects]; u[idx].description = e.target.value; setProjects(u); }} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Technologies</label>
                  {proj.technologies.map((tech, ti) => (
                    <div key={ti} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={inputStyle} placeholder="React, Node..." value={tech} onChange={(e) => { const u = [...projects]; u[idx].technologies[ti] = e.target.value; setProjects(u); }} />
                      {proj.technologies.length > 1 && (
                        <button style={{ ...removeBtnStyle, padding: "6px 10px" }} onClick={() => { const u = [...projects]; u[idx].technologies = u[idx].technologies.filter((_, i) => i !== ti); setProjects(u); }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button style={{ ...addBtnStyle, fontSize: 12, padding: "6px 14px" }} onClick={() => { const u = [...projects]; u[idx].technologies.push(""); setProjects(u); }}>+ Add Tech</button>
                </div>
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => setProjects([...projects, { name: "", description: "", technologies: [""], link: "" }])}>+ Add Project</button>
          </div>
        )}

        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Layout & Style Fine-Tuning</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div className="glass-light" style={{ padding: 20, borderRadius: 12 }}>
                <label style={labelStyle}>Page Margins (mm)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input type="range" min="10" max="40" value={layout.margin} onChange={(e) => setLayout({...layout, margin: parseInt(e.target.value)})} style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{layout.margin}</span>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 20, borderRadius: 12 }}>
                <label style={labelStyle}>Base Font Size (pt)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input type="range" min="8" max="14" step="0.5" value={layout.fontSize} onChange={(e) => setLayout({...layout, fontSize: parseFloat(e.target.value)})} style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{layout.fontSize}</span>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 20, borderRadius: 12 }}>
                <label style={labelStyle}>Line Spacing</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input type="range" min="1" max="2" step="0.1" value={layout.lineHeight} onChange={(e) => setLayout({...layout, lineHeight: parseFloat(e.target.value)})} style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{layout.lineHeight}</span>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 20, borderRadius: 12 }}>
                <label style={labelStyle}>Section Spacing (px)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input type="range" min="10" max="60" value={layout.sectionGap} onChange={(e) => setLayout({...layout, sectionGap: parseInt(e.target.value)})} style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{layout.sectionGap}</span>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 20, borderRadius: 12 }}>
                <label style={labelStyle}>Column Separation (px)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input type="range" min="10" max="60" value={layout.columnGap} onChange={(e) => setLayout({...layout, columnGap: parseInt(e.target.value)})} style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{layout.columnGap}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginTop: 8 }}>
              Note: These settings will be applied to the preview and the final PDF export.
            </p>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
          <button className="btn-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => s - 1)} style={{ opacity: currentStep === 0 ? 0.4 : 1 }}>
            ← Back
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-secondary" onClick={handleAIAutoComplete} disabled={enhancing || generating} style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))", borderColor: "rgba(99, 102, 241, 0.4)", color: "#e0e7ff", display: "flex", alignItems: "center", gap: 8 }}>
              {enhancing 
                ? (currentStep === 5 ? "Optimizing..." : "Building...") 
                : (currentStep === 5 ? "✦ AI Auto-Layout" : "✦ AI Auto-Complete")}
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentStep((s) => s + 1)}>Next →</button>
            ) : (
              <button className="btn-primary" onClick={handleGeneratePreview} disabled={generating || enhancing}>
                {generating ? "Generating..." : "✦ Preview Resume"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}
