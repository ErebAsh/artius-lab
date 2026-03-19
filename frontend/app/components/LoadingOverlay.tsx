"use client";

export default function LoadingOverlay() {
  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 0, 20, 0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Spinning ring */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin-slow 1s linear infinite",
          marginBottom: 32,
        }}
      />

      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 12,
          background:
            "linear-gradient(135deg, var(--foreground), var(--accent-light))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Generating Your Resume
      </h2>

      <p
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 340,
        }}
      >
        AI is analyzing and enhancing your content. This usually takes a few
        seconds...
      </p>

      {/* Animated dots */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 32,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: `float 1.5s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
