"use client";
import { useState, useRef } from "react";
import LoadingOverlay from "../components/LoadingOverlay";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ATSResult {
  score: number;
  keyword_matches: string[];
  missing_keywords: string[];
  improvements: string[];
  summary: string;
}

export default function ATSCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null); // Clear previous results
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setError("");
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setAnalyzing(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/ats/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Analysis failed");
      }

      const data: ATSResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <div style={{ minHeight: "100vh", padding: "160px 24px 100px", maxWidth: 900, margin: "0 auto" }}>
      {analyzing && <LoadingOverlay />}

      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 60 }}>
        <div style={{ 
          display: "inline-block", 
          padding: "6px 14px", 
          borderRadius: 20, 
          background: "rgba(16, 185, 129, 0.08)", 
          color: "#10b981", 
          fontSize: 12, 
          fontWeight: 600, 
          textTransform: "uppercase", 
          letterSpacing: 1, 
          marginBottom: 20, 
          border: "1px solid rgba(16, 185, 129, 0.2)"
        }}>
          ✦ Neural Analysis Engine
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            marginBottom: 16,
            background: "linear-gradient(135deg, #fff, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "var(--font-playfair)"
          }}
        >
          ATS Compatibility Audit
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 640, margin: "0 auto" }}>
          Upload your professional narrative to receive an instant neural audit, keyword analysis, and high-impact structural improvements.
        </p>
      </div>

      {!result ? (
        <div
          className="glass animate-fade-in-up"
          style={{
            padding: "48px 36px",
            borderRadius: 18,
            animationDelay: "0.1s",
            textAlign: "center",
          }}
        >
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--accent)",
              borderRadius: 12,
              padding: "40px 20px",
              cursor: "pointer",
              background: "rgba(99, 102, 241, 0.05)",
              transition: "all 0.3s ease",
              marginBottom: 24,
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
            {file ? (
              <h3 style={{ fontSize: 18, color: "var(--foreground)", fontWeight: 600 }}>{file.name}</h3>
            ) : (
              <>
                <h3 style={{ fontSize: 18, color: "var(--foreground)", fontWeight: 600, marginBottom: 8 }}>
                  Click to upload or drag and drop
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Only PDF files are supported</p>
              </>
            )}
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, color: "#ef4444", fontSize: 14 }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            style={{ padding: "14px 32px", fontSize: 16, width: "100%", maxWidth: 300 }}
          >
            {analyzing ? "Analyzing..." : "Analyze Resume"}
          </button>
        </div>
      ) : (
        <div className="glass animate-fade-in-up" style={{ padding: "36px", borderRadius: 18, animationDelay: "0.1s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Analysis Complete</h2>
              <p style={{ color: "var(--text-muted)", maxWidth: 500 }}>{result.summary}</p>
            </div>
            <div style={{ textAlign: "center", background: "var(--surface)", padding: "16px 32px", borderRadius: 16, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>ATS Score</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(result.score) }}>
                {result.score}<span style={{ fontSize: 24, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 32 }}>
            <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#10b981", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>✓</span> Keyword Matches
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.keyword_matches.length > 0 ? (
                  result.keyword_matches.map((kw, i) => (
                    <span key={i} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                      {kw}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>No significant keywords detected.</span>
                )}
              </div>
            </div>

            <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#ef4444", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚠</span> Missing Keywords
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.missing_keywords.length > 0 ? (
                  result.missing_keywords.map((kw, i) => (
                    <span key={i} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                      {kw}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Resume covers most standard keywords.</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Actionable Improvements</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {result.improvements.map((imp, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ background: "var(--accent)", color: "white", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                    {i + 1}
                  </span>
                  <span style={{ color: "var(--foreground)", fontSize: 15, lineHeight: 1.5 }}>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button className="btn-secondary" onClick={() => { setResult(null); setFile(null); }}>
              Check Another Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
