"use client";
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "60px 24px 32px",
        marginTop: "auto",
        borderTop: "1px solid var(--border)",
        background: "rgba(3, 0, 20, 0.6)",
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
          gap: 48,
          marginBottom: 48,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 2,
              background: "linear-gradient(135deg, var(--accent-light), #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 12,
            }}>
              ARTIUS LAB
            </h3>
            <p style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}>
              Precision-engineered resumes powered by neural AI. Build professional narratives that open doors.
            </p>

            {/* Social icons placeholder */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["X", "Li", "Gh"].map((s, i) => (
                <div key={i} style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--foreground)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                Product
              </span>
              <Link href="/templates" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>Templates</Link>
              <Link href="/ats" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>ATS Checker</Link>
              <Link href="/builder" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>Resume Builder</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--foreground)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                Company
              </span>
              <Link href="/settings" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>Settings</Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>GitHub</a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--border), transparent)",
          marginBottom: 24,
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
          opacity: 0.7,
        }}>
          <span>© {new Date().getFullYear()} Artius Lab. Built with ❤️ and AI.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <span style={{ cursor: "pointer" }}>Privacy</span>
            <span style={{ cursor: "pointer" }}>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
