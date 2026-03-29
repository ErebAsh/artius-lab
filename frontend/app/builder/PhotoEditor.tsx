"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import getCroppedImg from "./cropImage";

interface PhotoEditorProps {
  imageSrc: string;
  onSave: (croppedImage: string) => void;
  onCancel: () => void;
}

// ── Face Detection Utility ──
// Uses the browser's FaceDetector API (Chrome 70+) with a center fallback
async function detectFaceCenter(
  imageSrc: string
): Promise<{ x: number; y: number } | null> {
  try {
    // Check if FaceDetector API is available
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1 });
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageSrc;
      });

      const faces = await detector.detect(img);
      if (faces.length > 0) {
        const box = faces[0].boundingBox;
        return {
          x: (box.x + box.width / 2) / img.width,  // normalized 0–1
          y: (box.y + box.height / 2) / img.height,
        };
      }
    }
  } catch {
    console.log("FaceDetector API not available, using heuristic fallback");
  }

  // Fallback: simple skin-tone heuristic via canvas sampling
  try {
    return await detectFaceHeuristic(imageSrc);
  } catch {
    return null;
  }
}

// Heuristic face detection: scan for clusters of skin-tone pixels
async function detectFaceHeuristic(
  imageSrc: string
): Promise<{ x: number; y: number } | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = 200; // Sample at low res for speed
  const scale = Math.min(size / img.width, size / img.height);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let sumX = 0, sumY = 0, count = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];

      // Skin-tone detection heuristic (works across skin tones)
      if (isSkinTone(r, g, b)) {
        // Weight upper portion of image higher (faces are usually near top)
        const weight = 1 + (1 - y / canvas.height) * 0.5;
        sumX += x * weight;
        sumY += y * weight;
        count += weight;
      }
    }
  }

  if (count < 50) return null; // Not enough skin pixels found

  return {
    x: sumX / count / canvas.width,
    y: sumY / count / canvas.height,
  };
}

function isSkinTone(r: number, g: number, b: number): boolean {
  // Multiple color-space checks for robust skin detection
  // RGB rule
  if (r < 60 || g < 40 || b < 20) return false;
  if (r < g || r < b) return false;
  if (Math.abs(r - g) < 15 && b > g) return false; // grayish
  if (r - g < 15 && r - b < 15) return false;       // too similar = gray

  // Relaxed thresholds for diverse skin tones
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 20) return false; // too uniform

  // YCbCr color space check
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;

  return y > 50 && cb > 77 && cb < 127 && cr > 133 && cr < 180;
}

export default function PhotoEditor({ imageSrc, onSave, onCancel }: PhotoEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [saving, setSaving] = useState(false);
  const [faceDetecting, setFaceDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // ── Auto-detect face on mount ──
  useEffect(() => {
    let cancelled = false;
    const autoDetect = async () => {
      setFaceDetecting(true);
      const center = await detectFaceCenter(imageSrc);
      if (cancelled) return;
      if (center) {
        // Convert normalized face position to crop offset
        // react-easy-crop uses pixel offset from center, so we map 0-1 to appropriate range
        const offsetX = (0.5 - center.x) * 250; // Scale factor for visible movement
        const offsetY = (0.5 - center.y) * 250;
        setCrop({ x: offsetX, y: offsetY });
        setZoom(1.3); // Slight zoom for better face framing
        setFaceDetected(true);
      } else {
        setFaceDetected(false);
      }
      setFaceDetecting(false);
    };
    autoDetect();
    return () => { cancelled = true; };
  }, [imageSrc]);

  // ── Manual re-detect button ──
  const handleDetectFace = async () => {
    setFaceDetecting(true);
    setFaceDetected(null);
    const center = await detectFaceCenter(imageSrc);
    if (center) {
      const offsetX = (0.5 - center.x) * 250;
      const offsetY = (0.5 - center.y) * 250;
      setCrop({ x: offsetX, y: offsetY });
      setZoom(1.3);
      setFaceDetected(true);
    } else {
      setFaceDetected(false);
    }
    setFaceDetecting(false);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, {
        brightness,
        contrast,
        grayscale,
      });
      onSave(croppedImage);
    } catch (err) {
      console.error("Failed to crop image:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setGrayscale(0);
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) onCancel();
  };

  // ── Slider Component ──
  const Slider = ({
    label,
    icon,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = "",
    defaultVal,
  }: {
    label: string;
    icon: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    defaultVal: number;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
          {icon} {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: value !== defaultVal ? "var(--accent-light)" : "var(--text-muted)",
            minWidth: 35,
            textAlign: "right",
            opacity: value !== defaultVal ? 1 : 0.6,
          }}>
            {value}{unit}
          </span>
          {value !== defaultVal && (
            <button
              onClick={() => onChange(defaultVal)}
              style={{
                background: "var(--glow)",
                border: "none",
                borderRadius: 4,
                color: "var(--accent-light)",
                fontSize: 9,
                padding: "2px 6px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              RESET
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--accent-light)",
          height: 4,
          cursor: "pointer",
        }}
        className="photo-editor-slider"
      />
    </div>
  );

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        animation: "fadeIn 0.3s ease",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .photo-editor-slider::-webkit-slider-thumb { cursor: grab; }
        .photo-editor-slider::-webkit-slider-thumb:active { cursor: grabbing; }
        @media (max-width: 768px) {
          .photo-editor-body { flex-direction: column !important; }
          .photo-editor-controls { width: 100% !important; border-left: none !important; border-top: 1px solid var(--border) !important; }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-light) 50%, var(--surface) 100%)",
          borderRadius: 0,
          border: "none",
          boxShadow: "none",
          overflow: "hidden",
          animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "16px 32px",
          borderBottom: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--surface-light-glass)",
          backdropFilter: "blur(10px)",
          position: "relative",
        }}>
          {/* Gradient separator */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 24,
            right: 24,
            height: 1,
            background: "linear-gradient(90deg, transparent, var(--accent-light), var(--accent), var(--accent-light), transparent)",
            opacity: 0.4,
          }} />
          <div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(135deg, var(--foreground), var(--accent-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.04em",
            }}>
              Photo Editor
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0", fontWeight: 500, letterSpacing: 0.1, opacity: 0.8 }}>
              Refine and customize your professional profile image
            </p>
          </div>
          <button
            onClick={onCancel}
            title="Close Editor"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-light)",
              color: "var(--text-muted)",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-light)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.transform = "rotate(0deg) scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ transition: "inherit" }}>✕</span>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="photo-editor-body" style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}>
          {/* Left: Cropper Area */}
          <div style={{
            flex: 1,
            position: "relative",
            minHeight: 0,
            background: "#0a0a0f",
          }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: {
                  background: "var(--background)",
                },
                cropAreaStyle: {
                  border: "3px solid var(--accent-light)",
                  boxShadow: "0 0 0 9999px color-mix(in srgb, var(--background), transparent 20%), 0 0 40px var(--glow)",
                },
                mediaStyle: {
                  filter: `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`,
                },
              }}
            />

            {/* Face Detection Badge */}
            {faceDetecting && (
              <div style={{
                position: "absolute",
                top: 16,
                left: 16,
                padding: "8px 16px",
                background: "var(--glow)",
                border: "1px solid color-mix(in srgb, var(--accent), transparent 60%)",
                borderRadius: 30,
                color: "var(--accent-light)",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                zIndex: 10,
                backdropFilter: "blur(10px)",
              }}>
                <span style={{ animation: "pulse 1.2s ease infinite" }}>🔍</span>
                Detecting face...
              </div>
            )}
            {faceDetected === true && !faceDetecting && (
              <div style={{
                position: "absolute",
                top: 16,
                left: 16,
                padding: "8px 16px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: 30,
                color: "#34d399",
                fontSize: 12,
                fontWeight: 600,
                zIndex: 10,
                backdropFilter: "blur(10px)",
                animation: "fadeIn 0.3s ease",
              }}>
                ✓ Face centered
              </div>
            )}
          </div>

          {/* Vertical gradient separator */}
          <div style={{
            width: 1,
            flexShrink: 0,
            background: "linear-gradient(180deg, transparent, var(--accent-light), var(--accent), var(--accent-light), transparent)",
            opacity: 0.35,
          }} />

          {/* Right: Controls Panel */}
          <div className="photo-editor-controls custom-scrollbar" style={{
            width: 320,
            padding: "24px",
            borderLeft: "none",
            overflowY: "auto",
            scrollbarGutter: "stable",
            background: "var(--surface-light-glass)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>

            {/* Face Detect Button */}
            <button
              onClick={handleDetectFace}
              disabled={faceDetecting}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 88%), color-mix(in srgb, var(--accent-light), transparent 88%))",
                border: "1px solid color-mix(in srgb, var(--accent), transparent 70%)",
                borderRadius: 12,
                color: "var(--accent-light)",
                fontSize: 12,
                fontWeight: 700,
                cursor: faceDetecting ? "wait" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.3s",
                marginBottom: 10,
                letterSpacing: 0.3,
                opacity: faceDetecting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!faceDetecting) {
                  e.currentTarget.style.background = "linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 75%), color-mix(in srgb, var(--accent-light), transparent 75%))";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 88%), color-mix(in srgb, var(--accent-light), transparent 88%))";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {faceDetecting ? (
                <>
                  <span style={{ animation: "pulse 1.2s ease infinite" }}>🔍</span>
                  Detecting...
                </>
              ) : (
                <>
                  🎯 Center on Face
                </>
              )}
            </button>

            {/* Section: Transform */}
            <div style={{
              padding: "14px 16px",
              background: "var(--surface-light-glass)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 14,
                opacity: 0.6,
              }}>
                Transform
              </div>
              <Slider
                label="Zoom"
                icon="🔍"
                value={Math.round(zoom * 100)}
                onChange={(v) => setZoom(v / 100)}
                min={100}
                max={300}
                unit="%"
                defaultVal={100}
              />
              <Slider
                label="Rotation"
                icon="🔄"
                value={rotation}
                onChange={setRotation}
                min={-180}
                max={180}
                unit="°"
                defaultVal={0}
              />
              {/* Quick rotation buttons */}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[-90, -45, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setRotation((r) => {
                      let next = r + deg;
                      if (next > 180) next -= 360;
                      if (next < -180) next += 360;
                      return next;
                    })}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text-muted)",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--glow)";
                      e.currentTarget.style.color = "var(--accent-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-light)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Adjustments */}
            <div style={{
              padding: "14px 16px",
              background: "var(--surface-light-glass)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 14,
                opacity: 0.6,
              }}>
                Adjustments
              </div>
              <Slider
                label="Brightness"
                icon="☀️"
                value={brightness}
                onChange={setBrightness}
                min={30}
                max={200}
                unit="%"
                defaultVal={100}
              />
              <Slider
                label="Contrast"
                icon="◐"
                value={contrast}
                onChange={setContrast}
                min={30}
                max={200}
                unit="%"
                defaultVal={100}
              />
            </div>

            {/* Section: Filters */}
            <div style={{
              padding: "14px 16px",
              background: "var(--surface-light-glass)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 14,
                opacity: 0.6,
              }}>
                Filters
              </div>
              {/* Grayscale Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  🖤 Black & White
                </span>
                <div
                  onClick={() => setGrayscale(grayscale > 0 ? 0 : 100)}
                  style={{
                    width: 40,
                    height: 22,
                    background: grayscale > 0 ? "var(--accent-light)" : "var(--border)",
                    borderRadius: 20,
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                >
                  <div style={{
                    width: 16,
                    height: 16,
                    background: "#fff",
                    borderRadius: "50%",
                    position: "absolute",
                    top: 3,
                    left: grayscale > 0 ? 21 : 3,
                    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
              {grayscale > 0 && (
                <Slider
                  label="Intensity"
                  icon="🎚️"
                  value={grayscale}
                  onChange={setGrayscale}
                  min={10}
                  max={100}
                  unit="%"
                  defaultVal={100}
                />
              )}
            </div>

            {/* Reset All */}
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "1px dashed var(--border)",
                borderRadius: 10,
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                letterSpacing: 0.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent), transparent 70%)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              ↺ Reset All
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 24px",
          borderTop: "none",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          background: "var(--surface-light-glass)",
          position: "relative",
        }}>
          {/* Gradient separator */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 1,
            background: "linear-gradient(90deg, transparent, var(--accent-light), var(--accent), var(--accent-light), transparent)",
            opacity: 0.4,
          }} />
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              background: "var(--surface-light)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              opacity: 0.8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-light-glass)";
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-light)";
              e.currentTarget.style.opacity = "0.8";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 28px",
              background: saving
                ? "color-mix(in srgb, var(--accent), transparent 70%)"
                : "linear-gradient(135deg, var(--accent), var(--accent-light))",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.3s",
              boxShadow: saving ? "none" : "0 4px 20px var(--glow)",
              letterSpacing: 0.3,
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 25px var(--glow)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px var(--glow)";
            }}
          >
            {saving ? "Applying..." : "✓ Apply Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
