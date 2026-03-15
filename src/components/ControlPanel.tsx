/**
 * ControlPanel Component
 * ======================
 * Renders all user-controllable processing settings:
 *   1. Quality slider (JPEG/WEBP compression)
 *   2. Format selector (output format conversion)
 *   3. Max width/height inputs (optional resize)
 *
 * PROPS:
 *   options       — current ProcessingOptions state
 *   setOptions    — setter function from useState (passed down from hook)
 *   onProcess     — called when user clicks "Process All" button
 *   onClear       — called when user clicks "Clear All"
 *   hasPending    — true if any images await processing
 *   isProcessing  — true if actively processing (disables buttons)
 */

import type { ProcessingOptions } from "../types";

const FORMATS = [
  { value: "",      label: "Keep Original" },
  { value: "jpeg",  label: "JPEG (.jpg)" },
  { value: "png",   label: "PNG (.png)" },
  { value: "webp",  label: "WEBP (.webp)" },
  { value: "bmp",   label: "BMP (.bmp)" },
  { value: "gif",   label: "GIF (.gif)" },
  { value: "tiff",  label: "TIFF (.tiff)" },
];

interface ControlPanelProps {
  options: ProcessingOptions;
  setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  onProcess: () => void;
  onClear: () => void;
  hasPending: boolean;
  isProcessing: boolean;
}

export function ControlPanel({
  options,
  setOptions,
  onProcess,
  onClear,
  hasPending,
  isProcessing,
}: ControlPanelProps) {
  // Helper: update one field of the options object while keeping the rest.
  // Spread syntax (...options) copies all existing fields, then overrides the one we specify.
  const update = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  // Determine quality color based on value (red = low, green = high)
  const qualityColor =
    options.quality < 40 ? "#f87171"
    : options.quality < 70 ? "#fbbf24"
    : "#34d399";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "20px",
      padding: "28px",
    }}>
      <h2 style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#a5b4fc",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "24px",
      }}>
        ⚙️ Processing Options
      </h2>

      {/* ── Quality Slider ── */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 600 }}>
            Compression Quality
          </span>
          {/* Displays current value with dynamic color */}
          <span style={{
            color: qualityColor,
            fontWeight: 700,
            fontSize: "1rem",
            fontFamily: "monospace",
          }}>
            {options.quality}%
          </span>
        </label>

        {/*
          <input type="range"> is a browser-native slider.
          min/max define the range.
          value is controlled — React owns the value, not the DOM.
          onChange fires on every slider move.
        */}
        <input
          type="range"
          min={1}
          max={100}
          value={options.quality}
          onChange={(e) => update("quality", parseInt(e.target.value))}
          style={{ width: "100%", accentColor: qualityColor, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: "#64748b", fontSize: "0.75rem" }}>1 — Smallest file</span>
          <span style={{ color: "#64748b", fontSize: "0.75rem" }}>100 — Best quality</span>
        </div>
        <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: "6px" }}>
          Applies to JPEG and WEBP. PNG is lossless (ignores this setting).
        </p>
      </div>

      {/* ── Format Selector ── */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 600, marginBottom: "10px" }}>
          Convert Format
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
          {FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => update("targetFormat", fmt.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: options.targetFormat === fmt.value
                  ? "1px solid #6366f1"
                  : "1px solid rgba(255,255,255,0.08)",
                background: options.targetFormat === fmt.value
                  ? "rgba(99,102,241,0.25)"
                  : "rgba(255,255,255,0.03)",
                color: options.targetFormat === fmt.value ? "#a5b4fc" : "#94a3b8",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: options.targetFormat === fmt.value ? 700 : 400,
                transition: "all 0.2s ease",
              }}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resize Options ── */}
      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 600, marginBottom: "10px" }}>
          Max Dimensions <span style={{ color: "#64748b", fontWeight: 400 }}>(optional, aspect ratio preserved)</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {(["maxWidth", "maxHeight"] as const).map((dim) => (
            <div key={dim}>
              <label style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                {dim === "maxWidth" ? "Max Width (px)" : "Max Height (px)"}
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                placeholder="e.g. 1920"
                value={options[dim] ?? ""}
                onChange={(e) => update(dim, e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Process button — primary action */}
        <button
          onClick={onProcess}
          disabled={!hasPending || isProcessing}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: hasPending && !isProcessing
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.06)",
            color: hasPending && !isProcessing ? "#fff" : "#475569",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: hasPending && !isProcessing ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            fontFamily: "'Sora', sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {isProcessing ? "⏳ Processing..." : "⚡ Process All"}
        </button>

        {/* Clear button — secondary action */}
        <button
          onClick={onClear}
          style={{
            padding: "14px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "all 0.2s ease",
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
