"use client";
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "32px 24px 20px",
        marginTop: "auto",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        background: "linear-gradient(to bottom, rgba(3, 0, 20, 0.4), rgba(5, 5, 15, 0.95))",
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Top section */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 40,
          marginBottom: 24,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 340 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 2,
              background: "linear-gradient(135deg, #e2e8f0 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              ARTIUS LAB
            </h3>
            <p style={{
              fontSize: 13,
              color: "#94a3b8",
              lineHeight: 1.6,
            }}>
              Precision-engineered resumes powered by neural AI. Build incredibly professional and aesthetic narratives that seamlessly open doors for your career.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {[
                { 
                  name: "X", 
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg> 
                },
                { 
                  name: "LinkedIn", 
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> 
                },
                { 
                  name: "GitHub", 
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> 
                }
              ].map((s, i) => (
                <a 
                  key={i} 
                  title={s.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "rgba(168, 85, 247, 0.15)";
                    e.currentTarget.style.border = "1px solid rgba(168, 85, 247, 0.4)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(168, 85, 247, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#e2e8f0",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>
                Product
              </span>
              {[
                { name: "Premium Templates", path: "/templates" },
                { name: "AI Modifier", path: "/modifier" },
                { name: "ATS Checker", path: "/ats" },
                { name: "Resume Builder", path: "/builder" },
              ].map(link => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  style={{ 
                    fontSize: 13, 
                    color: "#64748b", 
                    textDecoration: "none", 
                    transition: "color 0.2s ease" 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#a855f7"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#e2e8f0",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>
                Company
              </span>
              <Link 
                href="/settings" 
                style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#a855f7"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
              >
                Settings
              </Link>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#a855f7"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
              >
                GitHub Open Source
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          marginBottom: 16,
        }} />

        {/* Bottom */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#64748b",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <span>© {new Date().getFullYear()} Artius Lab. Engineered with precision.</span>
          <div style={{ display: "flex", gap: 24 }}>
            <span 
              style={{ cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
            >
              Privacy Policy
            </span>
            <span 
              style={{ cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
            >
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
