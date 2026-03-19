"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function AnimatedText({ text, delay = 0 }: { text: string; delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <span style={{
            display: "inline-block",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
            {text}
        </span>
    );
}

function FloatingParticle({ size, x, y, duration, delay }: { size: number; x: string; y: string; duration: number; delay: number }) {
    return (
        <div style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.15,
            left: x,
            top: y,
            animation: `float ${duration}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            filter: `blur(${size > 6 ? 2 : 0}px)`,
            pointerEvents: "none",
        }} />
    );
}

export default function Hero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let time = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);
            time += 0.003;

            // Animated gradient mesh blobs
            const blobs = [
                { x: w * 0.3 + Math.sin(time * 1.2) * 80, y: h * 0.4 + Math.cos(time * 0.8) * 60, r: 280, color: "rgba(99, 102, 241, 0.08)" },
                { x: w * 0.7 + Math.cos(time * 0.9) * 100, y: h * 0.3 + Math.sin(time * 1.1) * 70, r: 220, color: "rgba(167, 139, 250, 0.06)" },
                { x: w * 0.5 + Math.sin(time * 0.7) * 60, y: h * 0.7 + Math.cos(time * 1.3) * 50, r: 200, color: "rgba(129, 140, 248, 0.07)" },
            ];

            blobs.forEach(blob => {
                const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
                grad.addColorStop(0, blob.color);
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            });

            // Subtle grid lines
            ctx.strokeStyle = "rgba(99, 102, 241, 0.03)";
            ctx.lineWidth = 1;
            const gridSize = 60;
            for (let x = 0; x < w; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    const particles = [
        { size: 4, x: "10%", y: "20%", duration: 5, delay: 0 },
        { size: 6, x: "85%", y: "15%", duration: 6, delay: 1.5 },
        { size: 3, x: "70%", y: "70%", duration: 4.5, delay: 0.8 },
        { size: 8, x: "20%", y: "75%", duration: 7, delay: 2 },
        { size: 5, x: "50%", y: "10%", duration: 5.5, delay: 0.4 },
        { size: 3, x: "90%", y: "50%", duration: 4, delay: 1 },
        { size: 4, x: "35%", y: "85%", duration: 6, delay: 1.8 },
    ];

    return (
        <section style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            paddingTop: 120,
            paddingBottom: 80,
        }}>
            {/* Animated Canvas Background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Floating particles */}
            {particles.map((p, i) => (
                <FloatingParticle key={i} {...p} />
            ))}

            {/* Top gradient line */}
            <div style={{
                position: "absolute",
                top: 80,
                left: "50%",
                transform: "translateX(-50%)",
                width: 200,
                height: 1,
                background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                opacity: 0.5,
            }} />

            <div className="container-max" style={{ position: "relative", zIndex: 1 }}>
                <div className="hero-content">
                    <div className="hero-text">
                        {/* Animated Badge */}
                        <div
                            className="animate-fade-in-up"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 20px",
                                borderRadius: 30,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "var(--accent-light)",
                                marginBottom: 48,
                                textTransform: "uppercase",
                                letterSpacing: 3,
                                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(167, 139, 250, 0.05))",
                                border: "1px solid rgba(99, 102, 241, 0.2)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#22c55e",
                                boxShadow: "0 0 8px #22c55e, 0 0 20px rgba(34, 197, 94, 0.3)",
                                animation: "pulse-glow 2s infinite",
                            }} />
                            Powered by Neural AI
                        </div>

                        {/* Main Headline */}
                        <h1 style={{
                            fontSize: "clamp(38px, 5vw, 76px)",
                            fontWeight: 900,
                            lineHeight: 1.1,
                            marginBottom: 36,
                            fontFamily: "var(--font-playfair)",
                            letterSpacing: -1,
                        }} className="hero-title">
                            <AnimatedText text="Resumes that stop" delay={200} />
                            <br />
                            <span style={{
                                background: "linear-gradient(135deg, var(--accent-light), #c084fc, var(--accent))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                backgroundSize: "200% auto",
                                animation: "gradient-shift 4s ease-in-out infinite",
                            }}>
                                <AnimatedText text="get you hired." delay={500} />
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                            <p style={{
                                fontSize: "clamp(16px, 1.8vw, 20px)",
                                color: "var(--text-muted)",
                                lineHeight: 1.75,
                                maxWidth: 600,
                                margin: "0 auto 56px",
                                fontWeight: 400,
                            }} className="hero-subtitle">
                                Guessing what recruiters want. Our AI engine crafts
                                <span style={{ color: "var(--foreground)", fontWeight: 600 }}> ATS-optimized, </span>
                                beautifully designed resumes that land interviews at top companies.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="animate-fade-in-up hero-cta" style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",
                            justifyContent: "center",
                            animationDelay: "0.8s",
                        }}>
                            <Link
                                href="/templates"
                                className="btn-primary"
                                style={{
                                    padding: "18px 40px",
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    boxShadow: "0 0 40px rgba(99, 102, 241, 0.3), 0 4px 20px rgba(0,0,0,0.3)",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    Build Your Resume
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </Link>
                            <Link
                                href="/ats"
                                className="btn-secondary"
                                style={{
                                    padding: "18px 32px",
                                    borderRadius: 14,
                                    fontSize: 15,
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12l2 2 4-4" />
                                        <circle cx="12" cy="12" r="10" />
                                    </svg>
                                    ATS Score Check
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual animate-fade-in" style={{ animationDelay: "1s" }}>
                        <img
                            src="/images/home_icon.png"
                            alt="AI Resume Assistant"
                            style={{
                                width: "100%",
                                maxWidth: 480,
                                height: "auto",
                                objectFit: "contain",
                                position: "relative",
                                zIndex: 1,
                                filter: "none",
                                mixBlendMode: "screen",
                                animation: "float 6s ease-in-out infinite",
                                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 98%)",
                                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 98%)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom fade */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 300,
                background: "linear-gradient(to bottom, transparent, var(--background) 90%)",
                pointerEvents: "none",
                zIndex: 2,
            }} />
        </section>
    );
}
