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
        borderTop: "1px solid var(--border)",
        background: "var(--surface-glass)",
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
              background: "linear-gradient(135deg, var(--foreground) 0%, var(--accent) 100%)",
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
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}>
              Precision-engineered resumes powered by neural AI. Build incredibly professional and aesthetic narratives that seamlessly open doors for your career.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {[
                { 
                  name: "YouTube", 
                  url: "https://youtube.com/@erebash",
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2A29 29 0 0 0 12 4a29 29 0 0 0-8.6.42 2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2A29 29 0 0 0 12 20a29 29 0 0 0 8.6-.42 2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> 
                },
                { 
                  name: "LinkedIn", 
                  url: "https://www.linkedin.com/in/himanshurajjnu",
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> 
                },
                { 
                  name: "GitHub", 
                  url: "https://github.com/ErebAsh/artius-lab",
                  svg: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> 
                }
              ].map((s, i) => (
                <a 
                  key={i} 
                  title={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--foreground)";
                    e.currentTarget.style.background = "var(--border)";
                    e.currentTarget.style.border = "1px solid var(--accent)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px var(--glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "var(--surface)";
                    e.currentTarget.style.border = "1px solid var(--border)";
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
                color: "var(--foreground)",
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
                    color: "var(--text-muted)", 
                    textDecoration: "none", 
                    transition: "color 0.2s ease" 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--foreground)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>
                Company
              </span>
              <Link 
                href="/settings" 
                style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-light)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Settings
              </Link>
              <a 
                href="https://github.com/ErebAsh/artius-lab" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-light)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
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
          background: "linear-gradient(90deg, transparent, var(--border), transparent)",
          marginBottom: 16,
        }} />

        {/* Bottom */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <span>© {new Date().getFullYear()} Artius Lab. Engineered with precision.</span>
          <div style={{ display: "flex", gap: 24 }}>
            <span 
              style={{ cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              Privacy Policy
            </span>
            <span 
              style={{ cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
