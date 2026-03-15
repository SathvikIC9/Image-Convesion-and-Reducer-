/**
 * API UTILITIES
 * =============
 * This module is the ONLY place where HTTP calls happen.
 * Centralizing API logic means:
 *   - One place to update the base URL
 *   - One place to add auth headers later
 *   - Components stay clean — they just call functions, not fetch()
 */

import type { ProcessingOptions, ProcessingResult, HealthStatus } from "../types";

/** Base URL of the FastAPI backend. Vite exposes env vars prefixed with VITE_ */
const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────
// checkHealth()
// Pings the /health endpoint to verify the backend is reachable.
// Called once on app mount and shown in the UI header.
// ─────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { status: "offline" };
    const data = await res.json();
    return { status: "online", supportedFormats: data.supported_formats };
  } catch {
    return { status: "offline" };
  }
}

// ─────────────────────────────────────────────────────────────
// processImage()
// Sends a single image + options to POST /process.
// Uses FormData — the standard way to send files over HTTP.
//
// FormData works like a dictionary:
//   formData.append("file", file)       ← the binary image
//   formData.append("quality", "85")    ← text fields (always strings)
//
// The backend reads these with FastAPI's Form() and File() decorators.
// ─────────────────────────────────────────────────────────────
export async function processImage(
  file: File,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quality", String(options.quality));
  formData.append("target_format", options.targetFormat);

  if (options.maxWidth)  formData.append("max_width",  String(options.maxWidth));
  if (options.maxHeight) formData.append("max_height", String(options.maxHeight));

  const response = await fetch(`${API_BASE}/process`, {
    method: "POST",
    body: formData,
    // NOTE: Do NOT set Content-Type manually — the browser sets it automatically
    // with the correct multipart boundary when using FormData.
  });

  if (!response.ok) {
    // Parse the FastAPI error response ({"detail": "..."})
    const err = await response.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  // ── Read custom response headers ──
  // The backend sends statistics in HTTP response headers.
  // Headers are key-value metadata attached to every HTTP response.
  const originalSize   = parseInt(response.headers.get("X-Original-Size")   || "0");
  const compressedSize = parseInt(response.headers.get("X-Compressed-Size") || "0");
  const outputFormat   = response.headers.get("X-Output-Format") || "jpg";
  const width          = parseInt(response.headers.get("X-Image-Width")  || "0");
  const height         = parseInt(response.headers.get("X-Image-Height") || "0");

  // ── Convert response body to a downloadable URL ──
  // response.blob() reads the raw binary body as a Blob (Binary Large Object).
  // URL.createObjectURL() creates a temporary browser URL pointing to that blob.
  // The <a download> link uses this URL to trigger a file download.
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);

  // Extract filename from Content-Disposition header
  const disposition = response.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename="(.+?)"/);
  const filename = filenameMatch ? filenameMatch[1] : `compressed.${outputFormat}`;

  const compressionRatio = originalSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return { downloadUrl, filename, originalSize, compressedSize, compressionRatio, outputFormat, width, height };
}

// ─────────────────────────────────────────────────────────────
// formatBytes()
// Utility: converts raw byte count to a human-readable string.
// e.g. 1048576 → "1.0 MB"
// ─────────────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
