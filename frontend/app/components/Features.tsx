"use client";
import { useEffect, useRef, useState } from "react";

export default function Features() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#c084fc" />
                        </linearGradient>
                    </defs>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            title: "Premium Template Library",
            desc: "Artisan-crafted designs that combine high-end typography with strategic whitespace. Each template speaks the visual language of your industry.",
            gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.04))",
            span: "col-span-8",
            large: true,
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#6ee7b7" />
                        </linearGradient>
                    </defs>
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            ),
            title: "Neural AI Engine",
            desc: "Real-time suggestions powered by advanced language models. Transform weak bullets into high-impact achievement statements.",
            gradient: "linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(16, 185, 129, 0.03))",
            span: "col-span-4",
            large: false,
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f472b6" />
                            <stop offset="100%" stopColor="#f9a8d4" />
                        </linearGradient>
                    </defs>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            ),
            title: "Instant PDF Export",
            desc: "Pixel-perfect PDFs rendered in milliseconds. No alignment struggles, no formatting nightmares — just flawless output.",
            gradient: "linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(236, 72, 153, 0.03))",
            span: "col-span-4",
            large: false,
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
            title: "ATS Orchestration Engine",
            desc: "We don't just check keywords — we optimize the underlying data structure of your PDF for 100% readability by every major Applicant Tracking System worldwide.",
            gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.03))",
            span: "col-span-8",
            large: true,
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
                        fontSize: "clamp(32px, 4.5vw, 52px)",
                        fontWeight: 800,
                        marginBottom: 24,
                        fontFamily: "var(--font-playfair)",
                    }}>
                        Engineered for the{" "}
                        <span style={{
                            fontStyle: "italic",
                            fontWeight: 400,
                            background: "linear-gradient(135deg, var(--accent-light), #c084fc)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Elite.
                        </span>
                    </h2>
                    <p style={{
                        color: "var(--text-muted)",
                        maxWidth: 640,
                        margin: "0 auto",
                        fontSize: 18,
                        lineHeight: 1.7,
                    }}>
                        We've dismantled the traditional resume builder and rebuilt it with
                        neural intelligence and precision design.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid-cols-12">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className={`${f.span}`}
                            style={{
                                padding: f.large ? 48 : 36,
                                borderRadius: 28,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden",
                                minHeight: f.large ? 300 : 260,
                                gap: 16,
                                background: hoveredIdx === i ? f.gradient : "var(--surface-glass)",
                                backdropFilter: "blur(20px)",
                                border: `1px solid ${hoveredIdx === i ? "rgba(99, 102, 241, 0.3)" : "var(--border)"}`,
                                cursor: "default",
                                opacity: visible ? 1 : 0,
                                transform: visible ? "translateY(0)" : "translateY(30px)",
                                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                                transitionDelay: `${0.1 * i}s`,
                            }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            {/* Corner glow on hover */}
                            <div style={{
                                position: "absolute",
                                top: -60,
                                right: -60,
                                width: 200,
                                height: 200,
                                borderRadius: "50%",
                                background: f.gradient,
                                filter: "blur(60px)",
                                opacity: hoveredIdx === i ? 0.6 : 0,
                                transition: "opacity 0.4s ease",
                                pointerEvents: "none",
                            }} />

                            {/* Icon */}
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 52,
                                height: 52,
                                borderRadius: 16,
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid var(--border)",
                                position: "relative",
                                zIndex: 1,
                            }}>
                                {f.icon}
                            </div>

                            <div style={{ position: "relative", zIndex: 1 }}>
                                <h3 style={{
                                    fontSize: f.large ? 26 : 22,
                                    fontWeight: 800,
                                    marginBottom: 12,
                                    letterSpacing: -0.5,
                                }}>
                                    {f.title}
                                </h3>
                                <p style={{
                                    fontSize: f.large ? 16 : 15,
                                    color: "var(--text-muted)",
                                    lineHeight: 1.7,
                                    maxWidth: f.large ? 520 : "none",
                                }}>
                                    {f.desc}
                                </p>
                            </div>

                            {/* Large card decorative element */}
                            {f.large && (
                                <div style={{
                                    position: "absolute",
                                    bottom: -30,
                                    right: 30,
                                    opacity: 0.03,
                                    transform: "scale(4)",
                                    pointerEvents: "none",
                                }}>
                                    {f.icon}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
