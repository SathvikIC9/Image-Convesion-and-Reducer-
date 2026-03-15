/**
 * Header Component
 * ================
 * App-wide top bar showing:
 *   - Logo + app name
 *   - Server health indicator (green dot = online, red = offline)
 *
 * HEALTH INDICATOR:
 *   The dot pulses when status is "checking" (initial state),
 *   turns green when backend responds, red when unreachable.
 *   This gives users immediate feedback that the server is up.
 */

import type { HealthStatus } from "../types";

interface HeaderProps {
  health: HealthStatus;
}

export function Header({ health }: HeaderProps) {
  const dotColor =
    health.status === "online" ? "#10b981"
    : health.status === "offline" ? "#ef4444"
    : "#f59e0b";

  const statusLabel =
    health.status === "online" ? "Server Online"
    : health.status === "offline" ? "Server Offline"
    : "Connecting...";

  return (
    <header style={{
      position: "relative",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 40px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(0,0,0,0.2)",
      backdropFilter: "blur(20px)",
    }}>
      {/* ── Brand ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
        }}>
          🗜️
        </div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#f1f5f9",
            letterSpacing: "-0.02em",
          }}>
            PixelPress
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.75rem" }}>Image Reducer & Converter</p>
        </div>
      </div>

      {/* ── Server Health Pill ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Animated status dot */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
          animation: health.status === "checking" ? "pulse-dot 1s ease-in-out infinite" : "none",
        }} />
        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>
          {statusLabel}
        </span>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </header>
  );
}
