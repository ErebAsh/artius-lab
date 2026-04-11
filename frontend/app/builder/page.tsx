"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingOverlay from "../components/LoadingOverlay";
import ResumeEditor from "./ResumeEditor";
import PhotoEditor from "./PhotoEditor";
import { useAuth } from "../components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = [
  { 
    id: 0, 
    label: "Personal Info", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>👤</span>
    )
  },
  { 
    id: 1, 
    label: "Education", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>🎓</span>
    )
  },
  { 
    id: 2, 
    label: "Experience", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>💼</span>
    )
  },
  { 
    id: 3, 
    label: "Skills & Expertise", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2)) animate-pulse",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>⚡</span>
    )
  },
  { 
    id: 4, 
    label: "Projects", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>🚀</span>
    )
  },
  { 
    id: 5, 
    label: "Certifications", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>🏆</span>
    )
  },
  { 
    id: 6, 
    label: "Languages", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>🌐</span>
    )
  },
  { 
    id: 7, 
    label: "Layout & Style", 
    icon: (
      <span style={{ 
        display: "flex", 
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        fontSize: "22px",
        transform: "perspective(100px) rotateX(10deg)"
      }}>🎨</span>
    )
  },
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
  start_date: string;
  end_date: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
  date: string;
}

interface Language {
  name: string;
  proficiency: string;
}

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") || "modern";
  const resumeIdParam = searchParams.get("resume");
  const { requireAuth, token } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [resumeId, setResumeId] = useState<number | null>(resumeIdParam ? parseInt(resumeIdParam) : null);
  const [templateHasPhoto, setTemplateHasPhoto] = useState(false);
  const [templateHasSkillLevels, setTemplateHasSkillLevels] = useState(false);
  const [templateHasLanguages, setTemplateHasLanguages] = useState(false);
  const [templateHasLanguageProficiency, setTemplateHasLanguageProficiency] = useState(false);
  const [templateHasAdvancedSkills, setTemplateHasAdvancedSkills] = useState(false);
  const [templateHasHobbies, setTemplateHasHobbies] = useState(false);
  const [templateHasProjectDates, setTemplateHasProjectDates] = useState(false);
  const [rawPhoto, setRawPhoto] = useState("");  // original unedited photo for re-editing
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  const [error, setError] = useState("");
  const [layout, setLayout] = useState({
    margin: 24,         // mm
    fontSize: 11,      // pt
    lineHeight: 1.5,   // unitless
    sectionGap: 24,    // px
    columnGap: 30,     // px
  });

  useEffect(() => {
    if (previewHtml || showPhotoEditor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [previewHtml, showPhotoEditor]);


  // ── Detect if the selected template supports photo & skill levels ──
  useEffect(() => {
    const fetchTemplateInfo = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/templates/${templateId}`);
        if (res.ok) {
          const data = await res.json();
          setTemplateHasPhoto(data.has_photo === true);
          
          // Detect skill levels support from properties or features
          const hasSkillFeatures = data.features?.some((f: string) => 
            f.toLowerCase().includes("skill bar") || 
            f.toLowerCase().includes("progress bar") ||
            f.toLowerCase().includes("proficiency") ||
            f.toLowerCase().includes("rating")
          );
          setTemplateHasSkillLevels(data.has_skill_levels === true || hasSkillFeatures);
          setTemplateHasLanguages(data.has_languages === true);
          setTemplateHasLanguageProficiency(data.has_language_proficiency === true);
          setTemplateHasAdvancedSkills(data.has_advanced_skills === true);
          setTemplateHasHobbies(data.has_hobbies === true);
          setTemplateHasProjectDates(data.has_project_dates === true);
        }
      } catch (err) {
        console.error("Failed to fetch template info:", err);
      }
    };
    fetchTemplateInfo();
  }, [templateId]);

  // Form state
  const [personal, setPersonal] = useState({
    full_name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    photo: "",
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
    { name: "", description: "", technologies: [""], link: "", start_date: "", end_date: "" },
  ]);

  const [certifications, setCertifications] = useState<Certification[]>([
    { name: "", issuer: "", year: "", date: "" },
  ]);

  const [languages, setLanguages] = useState<Language[]>([
    { name: "", proficiency: "Native" },
  ]);
  
  const [expertise, setExpertise] = useState({
    enabled: false,
    technical: [""],
    professional: [""]
  });

  const [hobbies, setHobbies] = useState({
    enabled: false,
    list: [""]
  });

  // ── Load resume from DB if ?resume=ID is present ──
  const loadResumeFromDB = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/resumes/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const rd = data.resume_data;

      if (rd.personal_info) setPersonal((prev: typeof personal) => ({ ...prev, ...rd.personal_info }));
      if (rd.education?.length) setEducation(rd.education);
      if (rd.experience?.length) setExperience(rd.experience);
      if (rd.skills?.length) setSkills(rd.skills);
      if (rd.projects?.length) setProjects(rd.projects);
      if (rd.certifications?.length) setCertifications(rd.certifications);
      if (rd.languages?.length) setLanguages(rd.languages);
      if (rd.expertise) {
        setExpertise({
          enabled: true,
          technical: rd.expertise.technical?.length ? rd.expertise.technical : [""],
          professional: rd.expertise.professional?.length ? rd.expertise.professional : [""]
        });
      }
      if (rd.hobbies) {
        if (Array.isArray(rd.hobbies)) {
          setHobbies({ enabled: false, list: rd.hobbies.length > 0 ? rd.hobbies : [""] });
        } else if (typeof rd.hobbies === 'object') {
          setHobbies({ 
            enabled: rd.hobbies.enabled ?? false, 
            list: rd.hobbies.list?.length ? rd.hobbies.list : [""] 
          });
        }
      }
      if (data.layout_settings) {
        setLayout((prev: typeof layout) => ({ ...prev, ...data.layout_settings }));
      }
    } catch (err) {
      console.error("Failed to load resume:", err);
    }
  }, []);

  useEffect(() => {
    if (resumeId) loadResumeFromDB(resumeId);
  }, [resumeId, loadResumeFromDB]);

  // ── Save / Update resume draft ──
  const handleSaveDraft = useCallback(async (isAutoSave = false) => {
    // Gate: require login to save
    if (isAutoSave) {
      if (!token) return;
    } else {
      if (!requireAuth()) return;
    }

    setSaving(true);
    setSaveMessage("");
    setError("");

    const resumeData = {
      personal_info: personal,
      education: education.filter((e) => e.institution.trim() !== ""),
      experience: experience
        .filter((e) => e.company.trim() !== "")
        .map(e => ({ ...e, highlights: e.highlights.filter(h => h.trim() !== "") })),
      skills: skills.filter((s) => s.name.trim() !== ""),
      projects: projects
        .filter((p) => p.name.trim() !== "")
        .map(p => ({ ...p, technologies: p.technologies.filter(t => t.trim() !== "") })),
      certifications: certifications.filter((c) => c.name.trim() !== ""),
      languages: languages.filter((l) => l.name.trim() !== ""),
      hobbies: hobbies.enabled ? hobbies.list.filter(h => h.trim() !== "") : [],
      expertise: expertise.enabled ? {
        technical: expertise.technical.filter(t => t.trim() !== ""),
        professional: expertise.professional.filter(p => p.trim() !== "")
      } : null
    };

    const title = personal.full_name.trim() || "Untitled Resume";

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("template_id", templateId);
      formData.append("resume_data", JSON.stringify(resumeData));
      formData.append("layout_settings", JSON.stringify(layout));

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res;
      if (resumeId) {
        res = await fetch(`${API_BASE}/api/resumes/${resumeId}`, { method: "PUT", body: formData, headers });
      } else {
        res = await fetch(`${API_BASE}/api/resumes`, { method: "POST", body: formData, headers });
      }

      if (!res.ok) {
        if (!isAutoSave) {
          const errData = await res.json();
          throw new Error(errData.detail || "Save failed");
        }
        return; // Silent fail for auto-save
      }

      const result = await res.json();
      if (!resumeId && result.id) {
        setResumeId(result.id);
      }
      setSaveMessage("Draft Saved");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      if (!isAutoSave) {
        setError(err instanceof Error ? err.message : "Failed to save resume.");
      }
    } finally {
      setSaving(false);
    }
  }, [requireAuth, token, personal, education, experience, skills, projects, expertise, hobbies, templateId, layout, resumeId, API_BASE]);

  // Auto-save effect
  useEffect(() => {
    if (!token || generating || enhancing) return;
    
    // Check if there is at least some data to save
    const hasData = personal.full_name || personal.email || education[0].institution || experience[0].company;
    if (!hasData) return;

    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [personal, education, experience, skills, projects, certifications, expertise, hobbies, layout, token, generating, enhancing, handleSaveDraft]);

  const handleAIAutoComplete = async () => {
    setEnhancing(true);
    setError("");

    const resumeData = {
      template_id: templateId,
      personal_info: personal,
      education: education.filter((e) => e.institution.trim() !== ""),
      experience: experience
        .filter((e) => e.company.trim() !== "")
        .map(e => ({ ...e, highlights: e.highlights.filter(h => h.trim() !== "") })),
      skills: skills.filter((s) => s.name.trim() !== ""),
      projects: projects
        .filter((p) => p.name.trim() !== "")
        .map(p => ({ ...p, technologies: p.technologies.filter(t => t.trim() !== "") })),
      certifications: certifications.filter((c) => c.name.trim() !== ""),
      languages: languages.filter((l) => l.name.trim() !== ""),
      hobbies: hobbies.enabled ? hobbies.list.filter(h => h.trim() !== "") : [],
      expertise: expertise.enabled ? {
        technical: expertise.technical.filter(t => t.trim() !== ""),
        professional: expertise.professional.filter(p => p.trim() !== "")
      } : null
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
      if (enhanced.certifications && enhanced.certifications.length > 0) {
        setCertifications(enhanced.certifications);
      }
      if (enhanced.languages && enhanced.languages.length > 0) {
        setLanguages(enhanced.languages);
      }
      if (enhanced.expertise) {
        setExpertise({
          enabled: true,
          technical: enhanced.expertise.technical?.length > 0 ? enhanced.expertise.technical : [""],
          professional: enhanced.expertise.professional?.length > 0 ? enhanced.expertise.professional : [""]
        });
      }
      if (enhanced.hobbies) {
        if (Array.isArray(enhanced.hobbies)) {
          setHobbies({ ...hobbies, list: enhanced.hobbies });
        } else {
          setHobbies({ 
            enabled: enhanced.hobbies.enabled ?? hobbies.enabled, 
            list: enhanced.hobbies.list || hobbies.list 
          });
        }
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
    // Gate: require login to preview/generate
    if (!requireAuth()) return;

    setGenerating(true);
    setError("");

    const resumeData = {
      template_id: templateId,
      personal_info: personal,
      education: education.filter((e) => e.institution.trim() !== ""),
      experience: experience
        .filter((e) => e.company.trim() !== "")
        .map(e => ({ ...e, highlights: e.highlights.filter(h => h.trim() !== "") })),
      skills: skills.filter((s) => s.name.trim() !== ""),
      projects: projects
        .filter((p) => p.name.trim() !== "")
        .map(p => ({ ...p, technologies: p.technologies.filter(t => t.trim() !== "") })),
      certifications: certifications.filter((c) => c.name.trim() !== ""),
      languages: languages.filter((l) => l.name.trim() !== ""),
      hobbies: hobbies.enabled ? hobbies.list.filter(h => h.trim() !== "") : [],
      expertise: expertise.enabled ? {
        technical: expertise.technical.filter(t => t.trim() !== ""),
        professional: expertise.professional.filter(p => p.trim() !== "")
      } : null
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
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 8, background: "linear-gradient(135deg, var(--foreground), var(--accent-light))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Build Your Resume
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, fontWeight: 500, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 8 }}>
            Active Template: <span style={{ color: "var(--accent-light)", fontWeight: 700, textTransform: "uppercase" }}>{templateId}</span>
            {(saving || saveMessage) && (
              <span style={{ 
                fontSize: 11, 
                color: saving ? "var(--accent-light)" : "#34d399", 
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background: saving ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
                animation: "fadeIn 0.3s ease"
              }}>
                {saving ? "Saving..." : `✓ ${saveMessage}`}
              </span>
            )}
          </p>
          <Link 
            href="/templates" 
            style={{ 
              fontSize: 11, 
              fontWeight: 800, 
              textDecoration: "none", 
              color: "var(--accent-light)",
              padding: "6px 16px",
              borderRadius: 30,
              background: "color-mix(in srgb, var(--accent-light), transparent 92%)",
              border: "1px solid color-mix(in srgb, var(--accent-light), transparent 85%)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "uppercase",
              letterSpacing: 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            className="hover:bg-accent-light/20 hover:border-accent-light/50 hover:-translate-y-0.5"
          >
            Change
          </Link>
        </div>
      </div>

      {/* Dynamic Modern Stepper (Short UI Approach) */}
      <div 
        className="glass animate-fade-in-up" 
        style={{ 
          display: "flex", 
          padding: "8px", 
          borderRadius: 24, 
          marginBottom: 44, 
          animationDelay: "0.1s",
          width: "fit-content",
          margin: "0 auto 44px",
          gap: 6,
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05) inset",
          position: "sticky",
          top: 100,
          zIndex: 50,
          backdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        {STEPS.filter(step => step.id !== 6 || templateHasLanguages).map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            title={step.label} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: currentStep === step.id ? 10 : 0, 
              padding: currentStep === step.id ? "10px 24px" : "10px", 
              minWidth: currentStep === step.id ? "auto" : 48, // Slightly wider to ensure no cropping
              height: 48, // Slightly taller for breathing room
              borderRadius: 22, 
              border: "none", 
              background: currentStep === step.id ? "linear-gradient(135deg, var(--accent), var(--accent-dark))" : "transparent", 
              color: currentStep === step.id ? "#fff" : "var(--text-muted)", 
              cursor: "pointer", 
              fontFamily: "inherit", 
              fontSize: 13, 
              fontWeight: 700, 
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)", 
              flexShrink: 0,
              whiteSpace: "nowrap",
              boxShadow: currentStep === step.id ? "0 8px 24px -6px var(--glow)" : "none",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (currentStep !== step.id) {
                e.currentTarget.style.background = "var(--surface-light-glass)";
                e.currentTarget.style.color = "var(--accent-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep !== step.id) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              width: 20, 
              height: 20,
              transform: currentStep === step.id ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.4s ease",
              flexShrink: 0
            }}>
              {step.icon}
            </span>
            
            <span style={{ 
              maxWidth: currentStep === step.id ? 200 : 0, // Use maxWidth for width transition
              overflow: "hidden", // Move overflow:hidden here to prevent icon cropping
              opacity: currentStep === step.id ? 1 : 0,
              visibility: currentStep === step.id ? "visible" : "hidden",
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              letterSpacing: "0.4px"
            }}>
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="glass animate-fade-in-up" style={{ padding: "32px 36px", borderRadius: 18, animationDelay: "0.2s" }}>
        {currentStep === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Personal Information</h2>

            {/* ── Photo Upload (only if template supports it) ── */}
            {templateHasPhoto && (
              <div style={{
                padding: 24,
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(236, 72, 153, 0.06))",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}>
                {/* Photo Preview */}
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid rgba(99, 102, 241, 0.3)",
                  flexShrink: 0,
                  background: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                  position: "relative",
                  cursor: personal.photo ? "pointer" : "default",
                }}
                  onClick={() => {
                    if (personal.photo && rawPhoto) setShowPhotoEditor(true);
                  }}
                >
                  {personal.photo ? (
                    <>
                      <img
                        src={personal.photo}
                        alt="Profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {/* Edit overlay on hover */}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s",
                        borderRadius: "50%",
                        fontSize: 20,
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
                      >
                        ✏️
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 32, color: "var(--text-muted)", opacity: 0.4 }}>📷</span>
                  )}
                </div>
                {/* Upload Controls */}
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, color: "var(--accent-light)", fontWeight: 700, fontSize: 11, letterSpacing: 1.5 }}>PROFILE PHOTO</label>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                    This template supports a profile photo. Upload a headshot for a more personalized resume.
                  </p>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label
                      htmlFor="photo-upload"
                      style={{
                        padding: "8px 20px",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        borderRadius: 10,
                        color: "var(--accent-light)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        transition: "all 0.3s",
                        display: "inline-block",
                      }}
                    >
                      {personal.photo ? "Change Photo" : "Upload Photo"}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError("Photo must be under 5MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const dataUrl = reader.result as string;
                            setRawPhoto(dataUrl);       // keep original for re-editing
                            setShowPhotoEditor(true);   // open editor immediately
                          };
                          reader.readAsDataURL(file);
                        }
                        // Reset input so the same file can be re-selected
                        e.target.value = "";
                      }}
                    />
                    {personal.photo && (
                      <>
                        <button
                          onClick={() => {
                            if (rawPhoto) setShowPhotoEditor(true);
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(168, 85, 247, 0.1)",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            borderRadius: 10,
                            color: "#a78bfa",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "inherit",
                            transition: "all 0.3s",
                          }}
                        >
                          ✏️ Edit Photo
                        </button>
                        <button
                          onClick={() => {
                            setPersonal({ ...personal, photo: "" });
                            setRawPhoto("");
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: 10,
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: 12,
                            fontFamily: "inherit",
                          }}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Photo Editor Modal ── */}
            {showPhotoEditor && rawPhoto && (
              <PhotoEditor
                imageSrc={rawPhoto}
                onSave={(croppedImage) => {
                  setPersonal({ ...personal, photo: croppedImage });
                  setShowPhotoEditor(false);
                }}
                onCancel={() => setShowPhotoEditor(false)}
              />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="John Doe" value={personal.full_name} onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Professional Title</label>
                <input style={inputStyle} placeholder="Software Engineer" value={personal.title} onChange={(e) => setPersonal({ ...personal, title: e.target.value })} />
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

            {/* Hobbies Section (Conditional) */}
            {templateHasHobbies && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={labelStyle}>Hobbies & Interests</label>
                  <label className="switch" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: hobbies.enabled ? "var(--accent-light)" : "var(--text-muted)" }}>
                      {hobbies.enabled ? "ENABLED" : "DISABLED"}
                    </span>
                    <div style={{ position: "relative", width: 44, height: 22 }}>
                      <input 
                        type="checkbox" 
                        checked={hobbies.enabled}
                        onChange={(e) => setHobbies({ ...hobbies, enabled: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: hobbies.enabled ? "var(--accent)" : "#ccc",
                        transition: ".4s", borderRadius: 34
                      }}>
                        <span style={{
                          position: "absolute", content: "", height: 16, width: 16, left: hobbies.enabled ? 24 : 4, bottom: 3,
                          backgroundColor: "white", transition: ".4s", borderRadius: "50%"
                        }}></span>
                      </span>
                    </div>
                  </label>
                </div>

                {hobbies.enabled && (
                  <div style={{ padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                      This template supports showing your hobbies. Add them below.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {hobbies.list.map((hobby, hIdx) => (
                        <div key={hIdx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            style={{ ...inputStyle, width: "auto", minWidth: 150 }} 
                            placeholder="e.g. Photography" 
                            value={hobby} 
                            onChange={(e) => {
                              const newList = [...hobbies.list];
                              newList[hIdx] = e.target.value;
                              setHobbies({ ...hobbies, list: newList });
                            }}
                          />
                          {hobbies.list.length > 1 && (
                            <button 
                              style={{ ...removeBtnStyle, padding: "8px 10px" }} 
                              onClick={() => setHobbies({ ...hobbies, list: hobbies.list.filter((_, i) => i !== hIdx) })}
                            >✕</button>
                          )}
                        </div>
                      ))}
                      <button 
                        style={{ ...addBtnStyle, padding: "8px 16px" }} 
                        onClick={() => setHobbies({ ...hobbies, list: [...hobbies.list, ""] })}
                      >+ Add Hobby</button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Skills & Expertise</h2>
              {templateHasAdvancedSkills && (
                <div 
                  onClick={() => setExpertise({...expertise, enabled: !expertise.enabled})}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    background: expertise.enabled ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.03)", 
                    padding: "6px 14px", 
                    borderRadius: 30, 
                    border: expertise.enabled ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  className="hover:scale-105"
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: expertise.enabled ? "var(--accent-light)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Advanced Columns</span>
                  <div style={{ 
                    width: 32, 
                    height: 18, 
                    background: expertise.enabled ? "var(--accent)" : "rgba(255,255,255,0.1)", 
                    borderRadius: 20, 
                    position: "relative",
                    transition: "background 0.3s"
                  }}>
                    <div style={{ 
                      width: 12, 
                      height: 12, 
                      background: "#fff", 
                      borderRadius: "50%", 
                      position: "absolute", 
                      top: 3, 
                      left: expertise.enabled ? 17 : 3,
                      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }} />
                  </div>
                </div>
              )}
            </div>
            
            {templateHasSkillLevels ? (
              <div style={{ padding: 28, background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "linear-gradient(to bottom, var(--accent), var(--accent-light))" }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "var(--accent-light)", fontWeight: 900, marginBottom: 4 }}>Live Skill Preview</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Adjust proficiency sliders to visualize your mastery level.</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {skills.map((skill, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                          <input 
                            style={{ ...inputStyle, border: "none", background: "transparent", padding: "4px 0", fontSize: 15, fontWeight: 700, width: "auto", minWidth: 120 }} 
                            placeholder="Skill Name (e.g. React)" 
                            value={skill.name} 
                            onChange={(e) => { const u = [...skills]; u[idx].name = e.target.value; setSkills(u); }} 
                          />
                          <div style={{ height: 1, flex: 1, background: "var(--border)", opacity: 0.3 }} />
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ 
                            fontSize: 10, 
                            fontWeight: 800, 
                            color: "var(--accent)", 
                            background: "var(--glow)", 
                            padding: "3px 10px", 
                            borderRadius: 20,
                            textTransform: "uppercase",
                            letterSpacing: 0.5
                          }}>
                            {skill.level}
                          </span>
                          {skills.length > 1 && (
                            <button 
                              style={{ ...removeBtnStyle, padding: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }} 
                              onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ 
                            position: "absolute", 
                            top: 0, 
                            left: 0, 
                            height: "100%", 
                            width: skill.level === "Beginner" ? "25%" : skill.level === "Intermediate" ? "50%" : skill.level === "Advanced" ? "75%" : "100%",
                            background: "linear-gradient(90deg, var(--accent-dark), var(--accent))",
                            transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: "0 0 15px var(--glow)"
                          }} />
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="4"
                          step="1"
                          value={skill.level === "Beginner" ? 1 : skill.level === "Intermediate" ? 2 : skill.level === "Advanced" ? 3 : 4}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
                            const u = [...skills];
                            u[idx].level = levels[val - 1];
                            setSkills(u);
                          }}
                          style={{ width: 100, height: 4, cursor: "pointer", accentColor: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    style={{ 
                      ...addBtnStyle, 
                      width: "100%", 
                      padding: "16px", 
                      marginTop: 12, 
                      background: "rgba(255,255,255,0.02)", 
                      border: "1px dashed var(--accent)",
                      borderRadius: 16,
                      color: "var(--accent-light)",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }} 
                    onClick={() => setSkills([...skills, { name: "", level: "Intermediate" }])}
                    className="hover:bg-accent/5 hover:scale-[1.01]"
                  >
                    <span style={{ fontSize: 18 }}>+</span> Add Another Proficiency
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: 24, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--accent-light)", fontWeight: 800 }}>Skill List</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {skills.map((skill, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Skill Name</label>
                        <input style={inputStyle} placeholder="React, Python..." value={skill.name} onChange={(e) => { const u = [...skills]; u[idx].name = e.target.value; setSkills(u); }} />
                      </div>
                      {skills.length > 1 && (
                        <button style={{ ...removeBtnStyle, padding: "10px 14px", marginBottom: 2 }} onClick={() => setSkills(skills.filter((_, i) => i !== idx))}>✕</button>
                      )}
                    </div>
                  ))}
                  <button 
                    style={{ ...addBtnStyle, width: "100%", padding: "14px", marginTop: 8, background: "rgba(255,255,255,0.02)", borderStyle: "solid" }} 
                    onClick={() => setSkills([...skills, { name: "", level: "Intermediate" }])}
                    className="hover:bg-white/5"
                  >
                    + Add New Skill
                  </button>
                </div>
              </div>
            )}

            {templateHasAdvancedSkills && expertise.enabled && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <div style={{ padding: 24, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
                  <label style={{ ...labelStyle, color: "var(--accent-light)", fontWeight: 800 }}>Technical Expertise</label>
                  {expertise.technical.map((tech, ti) => (
                    <div key={ti} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input style={inputStyle} placeholder="Web Development..." value={tech} onChange={(e) => { const u = [...expertise.technical]; u[ti] = e.target.value; setExpertise({...expertise, technical: u}); }} />
                      {expertise.technical.length > 1 && (
                        <button style={{ ...removeBtnStyle, padding: "10px 14px" }} onClick={() => { const u = expertise.technical.filter((_, i) => i !== ti); setExpertise({...expertise, technical: u}); }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button style={{ ...addBtnStyle, width: "100%", padding: "10px", marginTop: 4 }} onClick={() => setExpertise({...expertise, technical: [...expertise.technical, ""]})}>+ Add Technical</button>
                </div>
                <div style={{ padding: 24, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
                  <label style={{ ...labelStyle, color: "var(--accent-light)", fontWeight: 800 }}>Professional Skills</label>
                  {expertise.professional.map((prof, pi) => (
                    <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input style={inputStyle} placeholder="Team Leadership..." value={prof} onChange={(e) => { const u = [...expertise.professional]; u[pi] = e.target.value; setExpertise({...expertise, professional: u}); }} />
                      {expertise.professional.length > 1 && (
                        <button style={{ ...removeBtnStyle, padding: "10px 14px" }} onClick={() => { const u = expertise.professional.filter((_, j) => j !== pi); setExpertise({...expertise, professional: u}); }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button style={{ ...addBtnStyle, width: "100%", padding: "10px", marginTop: 4 }} onClick={() => setExpertise({...expertise, professional: [...expertise.professional, ""]})}>+ Add Professional</button>
                </div>
              </div>
            )}
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
                  {templateHasProjectDates && (
                    <>
                      <div>
                        <label style={labelStyle}>Start Date (Optional)</label>
                        <input style={inputStyle} placeholder="Jan 2023" value={proj.start_date || ""} onChange={(e) => { const u = [...projects]; u[idx].start_date = e.target.value; setProjects(u); }} />
                      </div>
                      <div>
                        <label style={labelStyle}>End Date (Optional)</label>
                        <input style={inputStyle} placeholder="Present" value={proj.end_date || ""} onChange={(e) => { const u = [...projects]; u[idx].end_date = e.target.value; setProjects(u); }} />
                      </div>
                    </>
                  )}
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
            <button style={addBtnStyle} onClick={() => setProjects([...projects, { name: "", description: "", technologies: [""], link: "", start_date: "", end_date: "" }])}>+ Add Project</button>
          </div>
        )}

        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Certifications</h2>
            {certifications.map((cert, idx) => (
              <div key={idx} style={{ padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-light)" }}>Certification #{idx + 1}</span>
                  {certifications.length > 1 && (
                    <button style={removeBtnStyle} onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}>Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Certification Name *</label>
                    <input style={inputStyle} placeholder="AWS Solutions Architect" value={cert.name} onChange={(e) => { const u = [...certifications]; u[idx].name = e.target.value; setCertifications(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Issuing Organization *</label>
                    <input style={inputStyle} placeholder="Amazon Web Services" value={cert.issuer} onChange={(e) => { const u = [...certifications]; u[idx].issuer = e.target.value; setCertifications(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input style={inputStyle} placeholder="2023" value={cert.year} onChange={(e) => { const u = [...certifications]; u[idx].year = e.target.value; setCertifications(u); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Full Date (Ex: May 2023)</label>
                    <input style={inputStyle} placeholder="May 2023" value={cert.date} onChange={(e) => { const u = [...certifications]; u[idx].date = e.target.value; setCertifications(u); }} />
                  </div>
                </div>
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => setCertifications([...certifications, { name: "", issuer: "", year: "", date: "" }])}>+ Add Certification</button>
          </div>
        )}

        {currentStep === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Languages</h2>
            <div style={{ padding: 24, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--accent-light)", fontWeight: 800 }}>List of Languages</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {languages.map((lang, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Language</label>
                      <input style={inputStyle} placeholder="English, Spanish..." value={lang.name} onChange={(e) => { const u = [...languages]; u[idx].name = e.target.value; setLanguages(u); }} />
                    </div>
                    {templateHasLanguageProficiency && (
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Proficiency</label>
                        <select 
                          style={inputStyle} 
                          value={lang.proficiency} 
                          onChange={(e) => { const u = [...languages]; u[idx].proficiency = e.target.value; setLanguages(u); }}
                        >
                          <option value="Native">Native</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Basic">Basic</option>
                        </select>
                      </div>
                    )}
                    {languages.length > 1 && (
                      <button style={{ ...removeBtnStyle, padding: "12px 14px", marginBottom: 2 }} onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}>✕</button>
                    )}
                  </div>
                ))}
                <button 
                  style={{ ...addBtnStyle, width: "100%", padding: "14px", marginTop: 8, background: "rgba(255,255,255,0.02)", borderStyle: "solid" }} 
                  onClick={() => setLanguages([...languages, { name: "", proficiency: "Fluent" }])}
                  className="hover:bg-white/5"
                >
                  + Add New Language
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
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

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12, alignItems: "center" }}>
          <button 
            className="btn-secondary" 
            onClick={() => {
              if (currentStep === 0) {
                router.push("/templates");
              } else {
                let prevStep = currentStep - 1;
                if (prevStep === 6 && !templateHasLanguages) prevStep = 5;
                setCurrentStep(prevStep);
              }
            }}
          >
            {currentStep === 0 ? "← Back to Templates" : "← Back"}
          </button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

            <button className="btn-secondary" onClick={handleAIAutoComplete} disabled={enhancing || generating} style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))", borderColor: "rgba(99, 102, 241, 0.4)", color: "#e0e7ff", display: "flex", alignItems: "center", gap: 8 }}>
              {enhancing 
                ? (currentStep === 7 ? "Optimizing..." : "Building...") 
                : (currentStep === 7 ? "✦ AI Auto-Layout" : "✦ AI Auto-Complete")}
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button 
                className="btn-primary" 
                onClick={() => {
                  let nextStep = currentStep + 1;
                  if (nextStep === 6 && !templateHasLanguages) nextStep = 7;
                  setCurrentStep(nextStep);
                }}
              >
                Next →
              </button>
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
