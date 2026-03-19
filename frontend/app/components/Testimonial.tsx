"use client";
import { useEffect, useRef, useState } from "react";

const testimonials = [
    {
        quote: "Artius Lab redefined my professional identity. Within two weeks, I secured interviews at three FAANG companies. It wasn't just a resume change — it was a career transformation.",
        name: "Sarah Chen",
        initials: "SC",
        role: "Software Engineer → Staff Engineer",
        company: "Google",
        color: "#818cf8",
    },
    {
        quote: "The ATS optimization is incredible. I went from getting zero callbacks to landing 5 interviews in a single week. The AI suggestions turned my boring bullet points into compelling achievements.",
        name: "Marcus Williams",
        initials: "MW",
        role: "Product Manager",
        company: "Stripe",
        color: "#34d399",
    },
    {
        quote: "As a career changer, I struggled to present my experience effectively. Artius Lab's AI restructured my entire narrative and I landed my dream role within a month.",
        name: "Priya Kapoor",
        initials: "PK",
        role: "Marketing → UX Design Lead",
        company: "Airbnb",
        color: "#f472b6",
    },
];

export default function Testimonial() {
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

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

    // Auto-rotate
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIdx(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section
            ref={sectionRef}
            className="section-padding"
            style={{
                position: "relative",
                background: "rgba(99, 102, 241, 0.01)",
                overflow: "hidden",
            }}
        >
            <div className="container-max" style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                    textAlign: "center",
                    marginBottom: 80,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(30px)",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                    <h2 style={{
                        fontSize: "clamp(28px, 4.5vw, 52px)",
                        fontWeight: 800,
                        fontFamily: "var(--font-playfair)",
                    }}>
                        Voices of{" "}
                        <span style={{
                            fontStyle: "italic",
                            fontWeight: 400,
                            background: "linear-gradient(135deg, var(--accent-light), #c084fc)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Transformation.
                        </span>
                    </h2>
                </div>

                {/* Stacked Cards Container */}
                <div style={{
                    position: "relative",
                    height: 500,
                    maxWidth: 800,
                    margin: "0 auto",
                    perspective: 1200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    {testimonials.map((t, i) => {
                        // Calculate position relative to activeIdx
                        let diff = i - activeIdx;
                        // Handle loop
                        if (diff < -1) diff += testimonials.length;
                        if (diff > 1) diff -= testimonials.length;

                        const isActive = diff === 0;
                        const isPrev = diff === -1 || (activeIdx === 0 && i === testimonials.length - 1);
                        const isNext = diff === 1 || (activeIdx === testimonials.length - 1 && i === 0);

                        // Define styles for stack effect
                        let transform = "translateX(0) scale(1) translateZ(0)";
                        let opacity = 0;
                        let zIndex = 0;
                        let filter = "blur(0px)";

                        if (isActive) {
                            transform = "translateX(0) scale(1) translateZ(100px)";
                            opacity = 1;
                            zIndex = 10;
                            filter = "blur(0px)";
                        } else if (isNext) {
                            transform = "translateX(40%) scale(0.85) translateZ(-100px) rotateY(-15deg)";
                            opacity = 0.4;
                            zIndex = 5;
                            filter = "blur(2px)";
                        } else if (isPrev) {
                            transform = "translateX(-40%) scale(0.85) translateZ(-100px) rotateY(15deg)";
                            opacity = 0.4;
                            zIndex = 5;
                            filter = "blur(2px)";
                        } else {
                            // Hidden cards
                            transform = "translateX(0) scale(0.7) translateZ(-300px)";
                            opacity = 0;
                            zIndex = 1;
                        }

                        return (
                            <div
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    maxWidth: 680,
                                    padding: "60px 48px",
                                    borderRadius: 32,
                                    background: "var(--surface-glass)",
                                    backdropFilter: "blur(20px)",
                                    border: `1px solid ${isActive ? "rgba(99, 102, 241, 0.3)" : "var(--border)"}`,
                                    textAlign: "center",
                                    cursor: isActive ? "default" : "pointer",
                                    transform,
                                    opacity,
                                    zIndex,
                                    filter,
                                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                                    boxShadow: isActive
                                        ? `0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)`
                                        : "0 10px 30px rgba(0,0,0,0.1)",
                                }}
                            >
                                {/* Decorative quote marks */}
                                <div style={{
                                    position: "absolute",
                                    top: 20,
                                    left: 40,
                                    fontSize: 80,
                                    fontFamily: "Georgia, serif",
                                    opacity: 0.1,
                                    lineHeight: 1,
                                    color: t.color,
                                    pointerEvents: "none",
                                }}>
                                    &ldquo;
                                </div>

                                {/* Quote */}
                                <p style={{
                                    fontSize: "clamp(16px, 2.2vw, 20px)",
                                    fontWeight: 500,
                                    fontFamily: "var(--font-playfair)",
                                    lineHeight: 1.7,
                                    color: "var(--foreground)",
                                    marginBottom: 32,
                                    position: "relative",
                                    zIndex: 1,
                                    fontStyle: "italic",
                                }}>
                                    &ldquo;{t.quote}&rdquo;
                                </p>

                                {/* Author */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    position: "relative",
                                    zIndex: 1,
                                }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 14,
                                        fontWeight: 900,
                                        color: "#fff",
                                        marginBottom: 4,
                                        boxShadow: `0 4px 20px ${t.color}33`,
                                    }}>
                                        {t.initials}
                                    </div>
                                    <div style={{
                                        fontWeight: 800,
                                        color: "var(--foreground)",
                                        fontSize: 14,
                                    }}>
                                        {t.name}
                                    </div>
                                    <div style={{
                                        color: t.color,
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}>
                                        {t.role}
                                    </div>
                                    <div style={{
                                        color: "var(--text-muted)",
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontWeight: 600,
                                        opacity: 0.7
                                    }}>
                                        @ {t.company}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Dots */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 40,
                }}>
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIdx(i)}
                            style={{
                                width: activeIdx === i ? 40 : 12,
                                height: 6,
                                borderRadius: 10,
                                background: activeIdx === i ? testimonials[i].color : "var(--border)",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                                opacity: activeIdx === i ? 1 : 0.3,
                            }}
                            aria-label={`View testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
