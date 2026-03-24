"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SavedResume {
  id: number;
  title: string;
  template_id: string;
  resume_data: Record<string, unknown>;
  layout_settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchResumes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/resumes`);
      if (!res.ok) throw new Error("Failed to load resumes");
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getTemplateBadgeColor = (templateId: string) => {
    const colors: Record<string, string> = {
      classic: "#6366f1",
      ats_pro: "#10b981",
      elegant_sidebar: "#f59e0b",
      modern_minimalist: "#8b5cf6",
    };
    return colors[templateId] || "#6366f1";
  };

  const getPersonalName = (resume: SavedResume): string => {
    const rd = resume.resume_data as Record<string, Record<string, string>>;
    return rd?.personal_info?.full_name || "Unnamed";
  };

  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 48 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            marginBottom: 12,
            background: "linear-gradient(135deg, var(--foreground), var(--accent-light))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          My Resumes
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 500, margin: "0 auto" }}>
          All your saved resume drafts in one place. Load, edit, or download anytime.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            padding: "14px 20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 12,
            color: "#ef4444",
            fontSize: 14,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin-slow 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading your resumes...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && resumes.length === 0 && (
        <div
          className="glass animate-fade-in-up"
          style={{
            textAlign: "center",
            padding: "80px 40px",
            borderRadius: 24,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 20 }}>📄</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "var(--foreground)" }}>No Resumes Yet</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
            Start building your first AI-powered resume. Choose a template and let our AI help you craft a professional resume.
          </p>
          <Link
            href="/templates"
            className="btn-primary"
            style={{ fontSize: 15, padding: "14px 32px", textDecoration: "none" }}
          >
            ✦ Create Your First Resume
          </Link>
        </div>
      )}

      {/* Resume Grid */}
      {!loading && resumes.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {resumes.map((resume, idx) => (
            <div
              key={resume.id}
              className="glass animate-fade-in-up"
              style={{
                padding: 0,
                borderRadius: 18,
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                animationDelay: `${idx * 0.05}s`,
                position: "relative",
              }}
            >
              {/* Card Header Gradient */}
              <div
                style={{
                  padding: "20px 24px 16px",
                  background: `linear-gradient(135deg, ${getTemplateBadgeColor(resume.template_id)}22, transparent)`,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", margin: 0, lineHeight: 1.3 }}>
                    {resume.title}
                  </h3>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: `${getTemplateBadgeColor(resume.template_id)}22`,
                      color: getTemplateBadgeColor(resume.template_id),
                      border: `1px solid ${getTemplateBadgeColor(resume.template_id)}44`,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resume.template_id.replace(/_/g, " ")}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
                  {getPersonalName(resume)}
                </p>
              </div>

              {/* Card Body */}
              <div style={{ padding: "16px 24px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Created</p>
                    <p style={{ fontSize: 12, color: "var(--foreground)", margin: "2px 0 0", fontWeight: 500 }}>{formatDate(resume.created_at)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Last Updated</p>
                    <p style={{ fontSize: 12, color: "var(--foreground)", margin: "2px 0 0", fontWeight: 500 }}>{formatDate(resume.updated_at)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    href={`/builder?template=${resume.template_id}&resume=${resume.id}`}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s",
                    }}
                  >
                    ✎ Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                    style={{
                      padding: "10px 16px",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 10,
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s",
                      opacity: deletingId === resume.id ? 0.5 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {deletingId === resume.id ? "..." : "🗑"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New CTA */}
      {!loading && resumes.length > 0 && (
        <div className="animate-fade-in-up" style={{ textAlign: "center", marginTop: 40, animationDelay: "0.3s" }}>
          <Link
            href="/templates"
            className="btn-secondary"
            style={{
              textDecoration: "none",
              fontSize: 14,
              padding: "12px 28px",
            }}
          >
            + Create New Resume
          </Link>
        </div>
      )}
    </div>
  );
}
