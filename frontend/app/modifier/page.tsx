"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import LoadingOverlay from "../components/LoadingOverlay";

// Dynamically import react-pdf to avoid SSR issues with DOMMatrix
const PDFDocument = dynamic(
  () => import("react-pdf").then((mod) => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    return { default: mod.Document };
  }),
  { ssr: false }
);

const PDFPage = dynamic(
  () => import("react-pdf").then((mod) => ({ default: mod.Page })),
  { ssr: false }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ParsedResume {
  personal_info: {
    full_name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
    summary: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    gpa: string;
    achievements: string;
  }>;
  experience: Array<{
    company: string;
    title: string;
    location?: string;
    start_date: string;
    end_date: string;
    description: string;
    highlights: string[];
  }>;
  skills: Array<{ name: string; level: string }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link: string;
  }>;
  expertise: { technical: string[]; professional: string[] };
  certifications: Array<{ name: string; issuer: string; year: string }>;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function ModifierPage() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [modifying, setModifying] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTemplateHovered, setIsTemplateHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/templates`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // File handling
  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB).");
      return;
    }
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    setError("");
    setParsedData(null);
    setChatHistory([]);
    setCurrentPage(1);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // Parse uploaded PDF
  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Parsing failed");
      }
      const data = await res.json();
      setParsedData(data.parsed_data);
      setChatHistory([
        {
          role: "ai",
          content: `✅ Resume parsed successfully! I found ${data.parsed_data.experience?.length || 0} experience entries, ${data.parsed_data.education?.length || 0} education entries, and ${data.parsed_data.skills?.length || 0} skills. Tell me what you'd like to modify!`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setParsing(false);
    }
  };

  // AI Chat modification
  const handleSendInstruction = async () => {
    // Early exit if input is empty, data missing, or a request is already in progress (Debounce)
    if (!chatInput.trim() || !parsedData || modifying) return;

    const instruction = chatInput.trim();
    // Clear input IMMEDIATELY to prevent double-send and provide visual feedback
    setChatInput("");
    setModifying(true);
    setError(""); // Clear any previous errors

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: instruction, timestamp: new Date() },
    ]);

    const formData = new FormData();
    formData.append("instruction", instruction);
    formData.append("resume_data", JSON.stringify(parsedData));

    try {
      const res = await fetch(`${API_BASE}/api/resume/modify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Modification failed");
      }

      const data = await res.json();
      
      if (data.modified_data) {
        setParsedData(data.modified_data);
      }

      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.changes_summary || "Changes applied successfully!",
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: `❌ ${err instanceof Error ? err.message : "Modification failed. Try again."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      // Small delay before allowing next request to prevent accidental spamming
      setTimeout(() => setModifying(false), 500);
    }
  };

  // Generate final PDF
  const handleGeneratePdf = async () => {
    if (!parsedData) return;
    setGenerating(true);
    setError("");

    try {
      // Step 1: Generate HTML from the modified data
      const htmlRes = await fetch(`${API_BASE}/api/generate/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          personal_info: parsedData.personal_info,
          education: parsedData.education,
          experience: parsedData.experience,
          skills: parsedData.skills,
          projects: parsedData.projects,
          expertise: parsedData.expertise,
        }),
      });

      if (!htmlRes.ok) {
        const errData = await htmlRes.json();
        throw new Error(errData.detail || "HTML generation failed");
      }

      const { html } = await htmlRes.json();

      // Step 2: Convert HTML to PDF
      const pdfRes = await fetch(`${API_BASE}/api/generate/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          filename: `${parsedData.personal_info.full_name.replace(/\s/g, "_") || "Resume"}_Modified.pdf`,
        }),
      });

      if (!pdfRes.ok) throw new Error("PDF generation failed");

      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${parsedData.personal_info.full_name.replace(/\s/g, "_") || "Resume"}_Modified.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Generation failed."
      );
    } finally {
      setGenerating(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Quick action suggestions
  const quickActions = [
    "Make my summary more professional",
    "Add quantifiable achievements to experience",
    "Improve bullet points with action verbs",
    "Make it more ATS-friendly",
    "Add missing technical skills",
    "Shorten the summary to 2 sentences",
  ];

  // ==================== UPLOAD VIEW ====================
  if (!parsedData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "140px 24px 100px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {parsing && <LoadingOverlay />}

        {/* Hero */}
        <div
          className="animate-fade-in-up"
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 20,
              background: "var(--glow)",
              color: "var(--accent)",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 20,
              border: "1px solid var(--border)",
            }}
          >
            ✦ AI-Powered Resume Modifier
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              marginBottom: 16,
              background: "linear-gradient(135deg, var(--foreground) 20%, var(--accent-light) 60%, var(--accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "var(--font-playfair)",
            }}
          >
            Modify Your Resume
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-muted)",
              maxWidth: 640,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Upload your existing resume, see it side-by-side, and tell AI exactly
            what to change. No forms, no hassle.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className="glass animate-fade-in-up"
          style={{
            padding: "48px 36px",
            borderRadius: 20,
            animationDelay: "0.1s",
            textAlign: "center",
          }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 16,
              padding: "56px 24px",
              cursor: "pointer",
              background: isDragging
                ? "var(--glow)"
                : "transparent",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              marginBottom: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Animated gradient border */}
            <div
              style={{
                position: "absolute",
                inset: -2,
                background:
                  "linear-gradient(135deg, var(--glow), transparent, var(--glow))",
                borderRadius: 18,
                zIndex: -1,
                opacity: isDragging ? 1 : 0,
                transition: "opacity 0.4s",
              }}
            />

            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              {file ? (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "var(--glow)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 30px var(--glow)",
                  color: "var(--accent)",
                  animation: "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "24px",
                  background: "var(--glow)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 30px var(--glow)",
                  color: "var(--accent)",
                  transform: isDragging ? "scale(1.1) translateY(-4px)" : "scale(1) translateY(0)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>
                </div>
              )}
            </div>

            {file ? (
              <div>
                <h3
                  style={{
                    fontSize: 20,
                    color: "var(--foreground)",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {file.name}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {(file.size / 1024).toFixed(1)} KB • Click to change file
                </p>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 20,
                    color: "var(--foreground)",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {isDragging
                    ? "Drop your resume here"
                    : "Upload your existing resume"}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 14,
                    maxWidth: 380,
                    margin: "0 auto",
                  }}
                >
                  Drag & drop your PDF or click to browse. Max 5MB.
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginBottom: 40,
            }}
          >
            {[
              { 
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>, 
                label: "Visual Preview", desc: "See your original PDF", color: "#a855f7" 
              },
              { 
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>, 
                label: "AI Parsing", desc: "Smart content extraction", color: "#3b82f6" 
              },
              { 
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10"/><path d="M17 3.5a2.121 2.121 0 0 1 3 3L13 13.5l-3 1 1-3Z"/></svg>, 
                label: "Chat to Edit", desc: "Natural language edits", color: "#ec4899" 
              },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 20px",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: 20,
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.border = `1px solid ${f.color}50`;
                  e.currentTarget.style.background = `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, ${f.color}10 100%)`;
                  e.currentTarget.style.boxShadow = `0 16px 40px ${f.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: `${f.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    marginBottom: 20,
                    border: `1px solid ${f.color}30`,
                    boxShadow: `0 0 24px ${f.color}20`,
                    transition: "transform 0.3s ease",
                  }}
                >
                  {f.icon}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 10,
                color: "#ef4444",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleParse}
            disabled={!file || parsing}
            style={{
              padding: "16px 40px",
              fontSize: 16,
              width: "100%",
              maxWidth: 340,
              background:
                "linear-gradient(135deg, var(--accent-light), var(--accent-dark))",
              boxShadow: "0 10px 30px -5px var(--glow)",
            }}
          >
            {parsing ? "Analyzing Resume..." : "✦ Parse & Modify Resume"}
          </button>
        </div>
      </div>
    );
  }

  // ==================== EDITOR VIEW (Split Panel) ====================
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#050510",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {generating && <LoadingOverlay />}

      {/* ===== TOP BAR ===== */}
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        {/* Left: Back + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => {
              setParsedData(null);
              setChatHistory([]);
            }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back
          </button>
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                letterSpacing: 0.5,
              }}
            >
              RESUME MODIFIER
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "#a855f7",
                margin: 0,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {parsedData.personal_info.full_name || "Resume"} • AI-Powered Editing
            </p>
          </div>
        </div>

        {/* Center: Template Selector */}
        {/* Center: Template Selector */}
        <div 
          style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}
          onMouseEnter={() => setIsTemplateHovered(true)}
          onMouseLeave={() => {
            setIsTemplateHovered(false);
            setHoveredTemplateId(null);
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Template:
          </span>
          
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              padding: "6px 28px 6px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              minWidth: 160,
              zIndex: 120,
              position: "relative",
            }}
          >
            {templates.find((t) => t.id === selectedTemplate)?.name || "Select Template"}
          </div>

          {isDropdownOpen && (
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 115 }} 
              onClick={() => setIsDropdownOpen(false)} 
            />
          )}

          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 70,
                marginTop: 8,
                width: 160,
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 0",
                zIndex: 120,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setIsDropdownOpen(false);
                    setHoveredTemplateId(null);
                  }}
                  onMouseEnter={() => setHoveredTemplateId(t.id)}
                  style={{
                    padding: "8px 16px",
                    color: t.id === selectedTemplate ? "#a855f7" : "#fff",
                    fontSize: 13,
                    fontWeight: t.id === selectedTemplate ? 600 : 400,
                    cursor: "pointer",
                    background: hoveredTemplateId === t.id ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}

          {(() => {
            const activeTemplate = hoveredTemplateId || selectedTemplate;
            const isValid = templates.some(t => t.id === activeTemplate);
            if (!isValid) return null;

            return (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "100%",
                  marginLeft: 16,
                  width: 200,
                  height: 283,
                  overflow: "hidden",
                  borderRadius: 8,
                  border: "2px solid rgba(168, 85, 247, 0.4)",
                  background: "#fff",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  zIndex: 110,
                  pointerEvents: "none",
                  opacity: isDropdownOpen ? 1 : 0,
                  transform: `translateX(0) translateY(${isDropdownOpen ? 0 : '10px'})`,
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  visibility: isDropdownOpen ? "visible" : "hidden",
                }}
                title="Template Preview"
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "800px",
                    height: "1131px",
                    transform: "scale(0.25)",
                    transformOrigin: "top left",
                  }}
                >
                  <iframe
                    key={activeTemplate}
                    src={`${API_BASE}/api/templates/${activeTemplate}/preview`}
                    style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#fff" }}
                    scrolling="no"
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Generate button */}
        <button
          onClick={handleGeneratePdf}
          disabled={generating}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 8px 24px -4px rgba(168, 85, 247, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {generating ? "Generating..." : "↓ Download Modified PDF"}
        </button>
      </div>

      {/* ===== MAIN SPLIT VIEW ===== */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ===== LEFT: PDF PREVIEW ===== */}
        <div
          style={{
            width: "42%",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            background: "#0a0a1a",
          }}
        >
          {/* PDF Controls */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(15, 23, 42, 0.6)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              📄 Original Resume
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Page navigation */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  opacity: currentPage <= 1 ? 0.3 : 1,
                }}
              >
                ‹
              </button>
              <span
                style={{
                  fontSize: 12,
                  color: "#fff",
                  fontWeight: 600,
                  minWidth: 60,
                  textAlign: "center",
                }}
              >
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(numPages, p + 1))
                }
                disabled={currentPage >= numPages}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  opacity: currentPage >= numPages ? 0.3 : 1,
                }}
              >
                ›
              </button>

              <div
                style={{
                  width: 1,
                  height: 16,
                  background: "rgba(255,255,255,0.1)",
                  margin: "0 4px",
                }}
              />

              {/* Zoom */}
              <button
                onClick={() =>
                  setPdfScale((s) => Math.max(0.5, s - 0.15))
                }
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                  minWidth: 36,
                  textAlign: "center",
                }}
              >
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                onClick={() =>
                  setPdfScale((s) => Math.min(2.0, s + 0.15))
                }
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* PDF Canvas */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              padding: "24px 16px",
              background:
                "radial-gradient(ellipse at center, #0f0f2e 0%, #050510 100%)",
            }}
          >
            {fileUrl && (
              <PDFDocument
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 14,
                    }}
                  >
                    Loading PDF...
                  </div>
                }
              >
                <div
                  style={{
                    boxShadow:
                      "0 30px 80px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <PDFPage
                    pageNumber={currentPage}
                    scale={pdfScale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              </PDFDocument>
            )}
          </div>
        </div>

        {/* ===== RIGHT: PARSED CONTENT + AI CHAT ===== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#08081a",
          }}
        >
          {/* Parsed Content Sections */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflow: "auto",
              padding: "20px 24px",
            }}
          >
            {/* Section header bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#a855f7",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Extracted Content
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, rgba(168,85,247,0.3), transparent)",
                }}
              />
            </div>

            {/* Personal Info Card */}
            <SectionCard
              title="Personal Info"
              icon="👤"
              isOpen={activeSection === "personal"}
              onToggle={() =>
                setActiveSection(
                  activeSection === "personal" ? null : "personal"
                )
              }
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <InfoPill
                  label="Name"
                  value={parsedData.personal_info.full_name}
                />
                <InfoPill
                  label="Title"
                  value={parsedData.personal_info.title}
                />
                <InfoPill
                  label="Email"
                  value={parsedData.personal_info.email}
                />
                <InfoPill
                  label="Phone"
                  value={parsedData.personal_info.phone}
                />
                <InfoPill
                  label="Location"
                  value={parsedData.personal_info.location}
                />
                <InfoPill
                  label="LinkedIn"
                  value={parsedData.personal_info.linkedin}
                />
              </div>
              {parsedData.personal_info.summary && (
                <div style={{ marginTop: 12 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Summary
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--foreground)",
                      lineHeight: 1.6,
                      margin: "6px 0 0",
                      opacity: 0.85,
                    }}
                  >
                    {parsedData.personal_info.summary}
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Experience */}
            {parsedData.experience?.length > 0 && (
              <SectionCard
                title={`Experience (${parsedData.experience.length})`}
                icon="💼"
                isOpen={activeSection === "experience"}
                onToggle={() =>
                  setActiveSection(
                    activeSection === "experience" ? null : "experience"
                  )
                }
              >
                {parsedData.experience.map((exp, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.04)",
                      marginBottom: i < parsedData.experience.length - 1 ? 10 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {exp.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#a855f7",
                            fontWeight: 500,
                          }}
                        >
                          {exp.company}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {exp.start_date} – {exp.end_date}
                      </span>
                    </div>
                    {exp.highlights?.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          padding: "0 0 0 16px",
                          listStyleType: "disc",
                        }}
                      >
                        {exp.highlights.map((h, hi) => (
                          <li
                            key={hi}
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.7)",
                              lineHeight: 1.5,
                              marginBottom: 3,
                            }}
                          >
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </SectionCard>
            )}

            {/* Education */}
            {parsedData.education?.length > 0 && (
              <SectionCard
                title={`Education (${parsedData.education.length})`}
                icon="🎓"
                isOpen={activeSection === "education"}
                onToggle={() =>
                  setActiveSection(
                    activeSection === "education" ? null : "education"
                  )
                }
              >
                {parsedData.education.map((edu, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.04)",
                      marginBottom: i < parsedData.education.length - 1 ? 10 : 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {edu.degree} in {edu.field_of_study}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#a855f7",
                        fontWeight: 500,
                      }}
                    >
                      {edu.institution}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {edu.start_date} – {edu.end_date}
                      {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                    </div>
                  </div>
                ))}
              </SectionCard>
            )}

            {/* Skills */}
            {parsedData.skills?.length > 0 && (
              <SectionCard
                title={`Skills (${parsedData.skills.length})`}
                icon="⚡"
                isOpen={activeSection === "skills"}
                onToggle={() =>
                  setActiveSection(
                    activeSection === "skills" ? null : "skills"
                  )
                }
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {parsedData.skills.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "5px 12px",
                        background: "rgba(168, 85, 247, 0.1)",
                        border: "1px solid rgba(168, 85, 247, 0.2)",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#c084fc",
                      }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Projects */}
            {parsedData.projects?.length > 0 && (
              <SectionCard
                title={`Projects (${parsedData.projects.length})`}
                icon="🚀"
                isOpen={activeSection === "projects"}
                onToggle={() =>
                  setActiveSection(
                    activeSection === "projects" ? null : "projects"
                  )
                }
              >
                {parsedData.projects.map((proj, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.04)",
                      marginBottom:
                        i < parsedData.projects.length - 1 ? 10 : 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {proj.name}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.7)",
                        lineHeight: 1.5,
                        margin: "6px 0 0",
                      }}
                    >
                      {proj.description}
                    </p>
                    {proj.technologies?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 8,
                        }}
                      >
                        {proj.technologies.map((t, ti) => (
                          <span
                            key={ti}
                            style={{
                              padding: "2px 8px",
                              background: "rgba(99,102,241,0.1)",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#818cf8",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </SectionCard>
            )}

            {/* Certifications */}
            {parsedData.certifications?.length > 0 && (
              <SectionCard
                title={`Certifications (${parsedData.certifications.length})`}
                icon="🏆"
                isOpen={activeSection === "certifications"}
                onToggle={() =>
                  setActiveSection(
                    activeSection === "certifications"
                      ? null
                      : "certifications"
                  )
                }
              >
                {parsedData.certifications.map((cert, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.04)",
                      marginBottom:
                        i < parsedData.certifications.length - 1
                          ? 8
                          : 0,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {cert.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {cert.issuer}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {cert.year}
                    </span>
                  </div>
                ))}
              </SectionCard>
            )}
          </div>

          {/* ===== AI CHAT BAR ===== */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(16px)",
              flexShrink: 0,
            }}
          >
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div
                className="custom-scrollbar"
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  padding: "12px 20px 4px",
                }}
              >
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "8px 14px",
                        borderRadius:
                          msg.role === "user"
                            ? "12px 12px 4px 12px"
                            : "12px 12px 12px 4px",
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, #a855f7, #6366f1)"
                            : "rgba(255,255,255,0.05)",
                        border:
                          msg.role === "ai"
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "none",
                        fontSize: 13,
                        color: msg.role === "user" ? "#fff" : "#e2e8f0",
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {modifying && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px 12px 12px 4px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      <span style={{ animation: "float 1s ease-in-out infinite" }}>•</span>
                      <span style={{ animation: "float 1s ease-in-out 0.2s infinite" }}>•</span>
                      <span style={{ animation: "float 1s ease-in-out 0.4s infinite" }}>•</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Quick Actions */}
            {chatHistory.length <= 1 && (
              <div
                style={{
                  padding: "8px 20px 4px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setChatInput(action)}
                    style={{
                      padding: "5px 12px",
                      background: "rgba(168, 85, 247, 0.06)",
                      border: "1px solid rgba(168, 85, 247, 0.15)",
                      borderRadius: 20,
                      color: "#c084fc",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div
              style={{
                padding: "12px 20px 16px",
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendInstruction();
                  }
                }}
                placeholder="Tell AI what to modify... (e.g. 'Add Docker to my skills', 'Make summary shorter')"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                  minHeight: 44,
                  maxHeight: 100,
                  transition: "border-color 0.3s",
                  lineHeight: 1.4,
                }}
                rows={1}
                disabled={modifying}
              />
              <button
                onClick={handleSendInstruction}
                disabled={!chatInput.trim() || modifying}
                style={{
                  padding: "12px 20px",
                  background:
                    chatInput.trim() && !modifying
                      ? "linear-gradient(135deg, #a855f7, #6366f1)"
                      : "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: chatInput.trim() && !modifying ? "pointer" : "default",
                  transition: "all 0.3s",
                  flexShrink: 0,
                  minWidth: 48,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: chatInput.trim() && !modifying ? 1 : 0.4,
                }}
              >
                {modifying ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "14px 24px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            zIndex: 11000,
            boxShadow: "0 10px 30px -5px rgba(16, 185, 129, 0.5)",
            animation: "fadeInUp 0.4s ease-out",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✅ PDF Downloaded Successfully!
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "14px 24px",
            background: "#ef4444",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            zIndex: 11000,
            boxShadow: "0 10px 30px -5px rgba(239, 68, 68, 0.5)",
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function SectionCard({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 14,
        border: `1px solid ${isOpen ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.04)"}`,
        background: isOpen
          ? "rgba(168, 85, 247, 0.03)"
          : "rgba(255,255,255,0.01)",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#fff",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
          {title}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            padding: "4px 16px 16px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div
      style={{
        padding: "8px 12px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#fff",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}
