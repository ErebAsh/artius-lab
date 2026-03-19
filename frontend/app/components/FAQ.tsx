"use client";
import { useState, useRef, useEffect } from "react";

export default function FAQ() {
    const [openIdx, setOpenIdx] = useState<number | null>(null);
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

    const faqs = [
        {
            question: "How does the AI optimize my resume?",
            answer: "Our neural engine analyzes your resume against thousands of job descriptions and industry benchmarks. It then rephrases your achievements using high-impact action verbs, quantifies your results, and structures the data for maximum ATS readability.",
        },
        {
            question: "Are the templates really ATS-friendly?",
            answer: "Absolutely. Every template is engineered with clean, parseable structures. We avoid complex layouts, headers/footers, and graphics that confuse ATS software. The result is a resume that looks stunning to humans and scores perfectly with machines.",
        },
        {
            question: "Can I customize the templates?",
            answer: "Yes! While our templates are pre-designed for professional impact, you can customize content, rearrange sections, and highlight the skills that matter most to your target role — all while maintaining ATS compatibility.",
        },
        {
            question: "Is there a free version?",
            answer: "Yes, you can create and export your first resume completely free. We also offer a complimentary ATS audit to check how your current resume performs against industry standards.",
        },
        {
            question: "How secure is my personal data?",
            answer: "We prioritize your privacy with end-to-end encryption for all data at rest and in transit. We never sell your information to third parties, and you can permanently delete your data at any time from the settings page.",
        },
    ];

    return (
        <section ref={sectionRef} className="section-padding" style={{ position: "relative" }}>
            <div className="container-max">
                {/* Section Header */}
                <div style={{
                    textAlign: "center",
                    marginBottom: 64,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(30px)",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 44px)",
                        fontWeight: 800,
                        fontFamily: "var(--font-playfair)",
                        marginBottom: 16,
                    }}>
                        Questions &{" "}
                        <span style={{
                            fontStyle: "italic",
                            fontWeight: 400,
                            background: "linear-gradient(135deg, var(--accent-light), #c084fc)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Answers.
                        </span>
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
                        Everything you need to know about building your perfect resume.
                    </p>
                </div>

                {/* FAQ Items */}
                <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                    {faqs.map((faq, i) => {
                        const isOpen = openIdx === i;
                        return (
                            <div
                                key={i}
                                style={{
                                    borderRadius: 20,
                                    background: isOpen ? "rgba(99, 102, 241, 0.04)" : "var(--surface-glass)",
                                    backdropFilter: "blur(20px)",
                                    border: `1px solid ${isOpen ? "rgba(99, 102, 241, 0.25)" : "var(--border)"}`,
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? "translateY(0)" : "translateY(20px)",
                                    transitionDelay: `${0.05 * i}s`,
                                }}
                            >
                                <button
                                    onClick={() => setOpenIdx(isOpen ? null : i)}
                                    style={{
                                        width: "100%",
                                        padding: "24px 28px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--foreground)",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        textAlign: "left",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            background: isOpen ? "var(--accent)" : "rgba(99, 102, 241, 0.1)",
                                            color: isOpen ? "#fff" : "var(--accent-light)",
                                            fontSize: 12,
                                            fontWeight: 900,
                                            flexShrink: 0,
                                            transition: "all 0.3s ease",
                                        }}>
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        {faq.question}
                                    </span>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="var(--accent-light)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                <div style={{
                                    maxHeight: isOpen ? 200 : 0,
                                    opacity: isOpen ? 1 : 0,
                                    overflow: "hidden",
                                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}>
                                    <p style={{
                                        padding: "0 28px 24px 72px",
                                        fontSize: 15,
                                        color: "var(--text-muted)",
                                        lineHeight: 1.7,
                                    }}>
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
