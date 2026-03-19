"use client";
import { useEffect, useRef, useState } from "react";

export default function Steps() {
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [activeStep, setActiveStep] = useState<number | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const steps = [
        {
            num: "01",
            title: "Choose Your Template",
            desc: "Browse our curated collection of ATS-optimized templates. Each one is designed for a specific industry aesthetic — from minimalist tech to bold creative.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            color: "#818cf8",
        },
        {
            num: "02",
            title: "Fill Your Details",
            desc: "Our smart form guides you through each section. Add your experience, education, and skills — our AI suggests improvements in real-time as you type.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            ),
            color: "#34d399",
        },
        {
            num: "03",
            title: "Download & Apply",
            desc: "Preview your polished resume, run a final ATS audit, and export a pixel-perfect PDF. You're ready to apply with confidence.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            ),
            color: "#f472b6",
        },
    ];

    return (
        <section ref={sectionRef} className="section-padding" style={{ position: "relative" }}>
            <div className="container-max">
                {/* Section Header */}
                <div style={{
                    textAlign: "center",
                    marginBottom: 80,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(30px)",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                    <h2 style={{
                        fontSize: "clamp(32px, 4vw, 48px)",
                        fontWeight: 800,
                        marginBottom: 16,
                        fontFamily: "var(--font-playfair)",
                    }}>
                        Three Steps to Your{" "}
                        <span style={{
                            fontStyle: "italic",
                            fontWeight: 400,
                            background: "linear-gradient(135deg, var(--accent-light), #c084fc)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Dream Resume.
                        </span>
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 18 }}>
                        A streamlined workflow designed for the modern professional.
                    </p>
                </div>

                {/* Steps Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 32,
                    position: "relative",
                }}>
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                textAlign: "center",
                                padding: "56px 40px",
                                borderRadius: 28,
                                background: activeStep === i
                                    ? `linear-gradient(135deg, ${s.color}11, ${s.color}06)`
                                    : "var(--surface-glass)",
                                backdropFilter: "blur(20px)",
                                border: `1px solid ${activeStep === i ? `${s.color}44` : "var(--border)"}`,
                                position: "relative",
                                overflow: "hidden",
                                opacity: visible ? 1 : 0,
                                transform: visible ? "translateY(0)" : "translateY(30px)",
                                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                                transitionDelay: `${0.15 * i}s`,
                                cursor: "default",
                            }}
                            onMouseEnter={() => setActiveStep(i)}
                            onMouseLeave={() => setActiveStep(null)}
                        >
                            {/* Step number - large background */}
                            <div style={{
                                position: "absolute",
                                top: -10,
                                right: 20,
                                fontSize: 120,
                                fontWeight: 900,
                                fontFamily: "var(--font-playfair)",
                                opacity: 0.03,
                                color: s.color,
                                lineHeight: 1,
                                pointerEvents: "none",
                            }}>
                                {s.num}
                            </div>

                            {/* Icon circle */}
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: `${s.color}15`,
                                border: `1px solid ${s.color}30`,
                                color: s.color,
                                marginBottom: 28,
                                transition: "all 0.4s ease",
                                transform: activeStep === i ? "scale(1.1)" : "scale(1)",
                                boxShadow: activeStep === i ? `0 0 30px ${s.color}20` : "none",
                            }}>
                                {s.icon}
                            </div>

                            {/* Step label */}
                            <div style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: s.color,
                                letterSpacing: 4,
                                marginBottom: 16,
                                textTransform: "uppercase",
                            }}>
                                Step {s.num}
                            </div>

                            <h4 style={{
                                fontSize: 22,
                                fontWeight: 800,
                                marginBottom: 16,
                                letterSpacing: -0.3,
                            }}>
                                {s.title}
                            </h4>
                            <p style={{
                                fontSize: 15,
                                color: "var(--text-muted)",
                                lineHeight: 1.7,
                            }}>
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
