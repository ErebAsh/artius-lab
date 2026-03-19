"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import LoadingOverlay from "../components/LoadingOverlay";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = [
  { id: 0, label: "Personal Info", icon: "👤" },
  { id: 1, label: "Education", icon: "🎓" },
  { id: 2, label: "Experience", icon: "💼" },
  { id: 3, label: "Skills", icon: "⚡" },
  { id: 4, label: "Projects", icon: "🚀" },
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");

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

  const handleAIEnhance = async () => {
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
        throw new Error(errData.detail || "AI enhancement failed");
      }

      const data = await res.json();
      const enhanced = data.enhanced_data;

      // Update state with enhanced data
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

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI enhancement failed. Please try again.");
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

      const { html } = await res.json();
      setPreviewHtml(html);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

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

  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 840, margin: "0 auto" }}>
      {generating && <LoadingOverlay />}

      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            marginBottom: 8,
            background: "linear-gradient(135deg, #fff, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Build Your Resume
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Template: <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{templateId}</span>
        </p>
      </div>

      {/* Progress Stepper */}
      {!previewHtml && (
        <div
          className="glass animate-fade-in-up"
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderRadius: 14,
            marginBottom: 32,
            animationDelay: "0.1s",
          }}
        >
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: currentStep === step.id ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: currentStep === step.id ? "var(--accent-light)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: currentStep === step.id ? 600 : 400,
                transition: "all 0.3s",
              }}
            >
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Form Content */}
      <div
        className="glass animate-fade-in-up"
        style={{ padding: "32px 36px", borderRadius: 18, animationDelay: "0.2s" }}
      >
        {previewHtml ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Resume Preview</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Click directly on the text below to make edits!</p>
            </div>
            
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              style={{
                width: "100%",
                height: "800px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "white",
              }}
              onLoad={(e) => {
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (doc) {
                  doc.body.contentEditable = "true";
                  doc.body.style.outline = "none";
                  doc.body.style.margin = "40px auto";
                  doc.body.style.maxWidth = "800px";
                  doc.body.style.boxShadow = "none";
                }
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setPreviewHtml(null)}>
                ← Back to Edit Data
              </button>
              <button className="btn-primary" onClick={handleDownloadPdf} disabled={generating}>
                {generating ? "Downloading..." : "↓ Download PDF"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* === STEP 0: Personal Info === */}
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

        {/* === STEP 1: Education === */}
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
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} placeholder="Dean's List, scholarships, relevant coursework..." value={edu.achievements} onChange={(e) => { const u = [...education]; u[idx].achievements = e.target.value; setEducation(u); }} />
                </div>
              </div>
            ))}
            <button
              style={addBtnStyle}
              onClick={() => setEducation([...education, { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", achievements: "" }])}
            >
              + Add Education
            </button>
          </div>
        )}

        {/* === STEP 2: Experience === */}
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
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }} placeholder="Brief description of your role and responsibilities..." value={exp.description} onChange={(e) => { const u = [...experience]; u[idx].description = e.target.value; setExperience(u); }} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Key Highlights</label>
                  {exp.highlights.map((h, hi) => (
                    <div key={hi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        style={inputStyle}
                        placeholder="Led a team of 5 engineers to deliver the project 2 weeks ahead of schedule"
                        value={h}
                        onChange={(e) => {
                          const u = [...experience];
                          u[idx].highlights[hi] = e.target.value;
                          setExperience(u);
                        }}
                      />
                      {exp.highlights.length > 1 && (
                        <button
                          style={{ ...removeBtnStyle, padding: "6px 10px", whiteSpace: "nowrap" as const }}
                          onClick={() => {
                            const u = [...experience];
                            u[idx].highlights = u[idx].highlights.filter((_, i) => i !== hi);
                            setExperience(u);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    style={{ ...addBtnStyle, fontSize: 12, padding: "6px 14px" }}
                    onClick={() => {
                      const u = [...experience];
                      u[idx].highlights.push("");
                      setExperience(u);
                    }}
                  >
                    + Add Highlight
                  </button>
                </div>
              </div>
            ))}
            <button
              style={addBtnStyle}
              onClick={() => setExperience([...experience, { company: "", title: "", start_date: "", end_date: "", description: "", highlights: [""] }])}
            >
              + Add Experience
            </button>
          </div>
        )}

        {/* === STEP 3: Skills === */}
        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Skills</h2>
            {skills.map((skill, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Skill Name</label>
                  <input style={inputStyle} placeholder="React, Python, AWS..." value={skill.name} onChange={(e) => { const u = [...skills]; u[idx].name = e.target.value; setSkills(u); }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Level</label>
                  <select
                    style={{ ...inputStyle, appearance: "none" as const }}
                    value={skill.level}
                    onChange={(e) => { const u = [...skills]; u[idx].level = e.target.value; setSkills(u); }}
                  >
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
            <button
              style={addBtnStyle}
              onClick={() => setSkills([...skills, { name: "", level: "Intermediate" }])}
            >
              + Add Skill
            </button>
          </div>
        )}

        {/* === STEP 4: Projects === */}
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
                    <input style={inputStyle} placeholder="AI Resume Builder" value={proj.name} onChange={(e) => { const u = [...projects]; u[idx].name = e.target.value; setProjects(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Link</label>
                    <input style={inputStyle} placeholder="github.com/you/project" value={proj.link} onChange={(e) => { const u = [...projects]; u[idx].link = e.target.value; setProjects(u); }} />
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
                      <input
                        style={inputStyle}
                        placeholder="React, FastAPI, Docker..."
                        value={tech}
                        onChange={(e) => {
                          const u = [...projects];
                          u[idx].technologies[ti] = e.target.value;
                          setProjects(u);
                        }}
                      />
                      {proj.technologies.length > 1 && (
                        <button
                          style={{ ...removeBtnStyle, padding: "6px 10px" }}
                          onClick={() => {
                            const u = [...projects];
                            u[idx].technologies = u[idx].technologies.filter((_, i) => i !== ti);
                            setProjects(u);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    style={{ ...addBtnStyle, fontSize: 12, padding: "6px 14px" }}
                    onClick={() => {
                      const u = [...projects];
                      u[idx].technologies.push("");
                      setProjects(u);
                    }}
                  >
                    + Add Technology
                  </button>
                </div>
              </div>
            ))}
            <button
              style={addBtnStyle}
              onClick={() => setProjects([...projects, { name: "", description: "", technologies: [""], link: "" }])}
            >
              + Add Project
            </button>
          </div>
        )}


        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
          <button
            className="btn-secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
            style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-secondary"
              onClick={handleAIEnhance}
              disabled={enhancing || generating}
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))",
                borderColor: "rgba(99, 102, 241, 0.4)",
                color: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {enhancing ? "Magic in progress..." : "✦ AI Magic Fill"}
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentStep((s) => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn-primary" id="generate-resume-btn" onClick={handleGeneratePreview} disabled={generating || enhancing}>
                {generating ? "Generating..." : "✦ Preview Resume"}
              </button>
            )}
          </div>
        </div>
        
          </>
        )}
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
