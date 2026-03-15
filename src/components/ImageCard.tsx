/**
 * ImageCard Component
 * ====================
 * Renders a single image in the queue with:
 *   - Preview thumbnail
 *   - Status indicator (pending / processing spinner / done ✓ / error ✗)
 *   - Compression stats (size before & after, ratio)
 *   - Download button (only visible when status === 'done')
 *   - Remove button
 *
 * STATUS STATES:
 *   pending    → grey border, no stats
 *   processing → pulsing border, spinning icon
 *   done       → green border, stats visible, download button
 *   error      → red border, error message
 *
 * KEY CONCEPT — Controlled Downloads:
 *   We don't link to a server URL. Instead, the backend returns raw binary
 *   bytes which we store as a Blob URL (blob:http://...) in state.
 *   The download button creates an <a> element programmatically,
 *   sets href to the blob URL, clicks it, then removes the element.
 */

import type { ImageFile } from "../types";
import { formatBytes } from "../utils/api";

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
}

const statusColors: Record<ImageFile["status"], string> = {
  pending:    "rgba(255,255,255,0.08)",
  processing: "#6366f1",
  done:       "#10b981",
  error:      "#ef4444",
};

export function ImageCard({ image, onRemove }: ImageCardProps) {
  const { id, file, previewUrl, status, errorMessage, result } = image;

  // ── Programmatic download ──────────────────────────────────────────────
  // We can't simply use <a href={blobUrl} download> as a static element
  // because it would always render. Instead we create it imperatively.
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const borderColor = statusColors[status];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "16px",
        overflow: "hidden",
        transition: "all 0.4s ease",
        boxShadow: status === "done"
          ? "0 0 20px rgba(16,185,129,0.1)"
          : status === "error"
          ? "0 0 20px rgba(239,68,68,0.1)"
          : "none",
        animation: status === "processing" ? "pulse-border 1.5s ease-in-out infinite" : "none",
      }}
    >
      {/* ── Image preview strip ── */}
      <div style={{ position: "relative", paddingTop: "56.25%" /* 16:9 ratio */ }}>
        <img
          src={previewUrl}
          alt={file.name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover", // Scale image to cover the box without distorting
          }}
        />

        {/* Processing spinner overlay */}
        {status === "processing" && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid rgba(99,102,241,0.3)",
              borderTop: "3px solid #6366f1",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: borderColor,
          color: "#fff",
          textTransform: "uppercase",
        }}>
          {status === "processing" ? "⏳" : status === "done" ? "✓" : status === "error" ? "✗" : "•"} {status}
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(id)}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.6)",
            color: "#cbd5e1",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          ×
        </button>
      </div>

      {/* ── Info section ── */}
      <div style={{ padding: "14px" }}>
        {/* Filename — truncated with CSS if too long */}
        <p style={{
          color: "#e2e8f0",
          fontSize: "0.85rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "8px",
          fontFamily: "monospace",
        }}>
          {file.name}
        </p>

        {/* Original size */}
        <p style={{ color: "#64748b", fontSize: "0.78rem" }}>
          Original: <span style={{ color: "#94a3b8" }}>{formatBytes(file.size)}</span>
        </p>

        {/* Done state: show compression stats + download */}
        {status === "done" && result && (
          <>
            <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px" }}>
              Compressed: <span style={{ color: "#34d399", fontWeight: 700 }}>{formatBytes(result.compressedSize)}</span>
              {" "}<span style={{
                background: "rgba(16,185,129,0.15)",
                color: "#34d399",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}>
                -{result.compressionRatio}%
              </span>
            </p>
            <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "4px" }}>
              {result.width}×{result.height}px · {result.outputFormat.toUpperCase()}
            </p>

            <button
              onClick={handleDownload}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "9px",
                borderRadius: "10px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.1)",
                color: "#34d399",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.82rem",
                transition: "all 0.2s ease",
              }}
            >
              ⬇ Download
            </button>
          </>
        )}

        {/* Error state */}
        {status === "error" && (
          <p style={{
            color: "#fca5a5",
            fontSize: "0.78rem",
            marginTop: "6px",
            padding: "8px",
            background: "rgba(239,68,68,0.1)",
            borderRadius: "8px",
          }}>
            ⚠ {errorMessage}
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.3); }
          50%       { box-shadow: 0 0 24px rgba(99,102,241,0.7); }
        }
      `}</style>
    </div>
  );
}
