/**
 * TYPES & INTERFACES
 * ==================
 * TypeScript's type system lets us define the "shape" of our data.
 * Instead of plain JS objects, every piece of data has a contract —
 * the compiler will warn us if we break it.
 */

/** Represents a single image file queued for processing */
export interface ImageFile {
  /** Browser-generated unique ID (crypto.randomUUID) */
  id: string;

  /** The raw File object from the browser's FileReader API */
  file: File;

  /** Object URL for previewing the image in <img> tags (URL.createObjectURL) */
  previewUrl: string;

  /** Current processing state */
  status: "pending" | "processing" | "done" | "error";

  /** Human-readable error if status === 'error' */
  errorMessage?: string;

  /** Results populated after successful processing */
  result?: ProcessingResult;
}

/** Stats returned from the backend after processing */
export interface ProcessingResult {
  /** Blob URL pointing to the processed image bytes (for download) */
  downloadUrl: string;

  /** Suggested filename for the download */
  filename: string;

  /** Original file size in bytes */
  originalSize: number;

  /** Compressed file size in bytes */
  compressedSize: number;

  /** Compression ratio as a percentage (how much smaller) */
  compressionRatio: number;

  /** Final output format e.g. "jpg" */
  outputFormat: string;

  /** Image dimensions after processing */
  width: number;
  height: number;
}

/** User-controlled processing settings */
export interface ProcessingOptions {
  /** JPEG/WEBP quality 1–100. PNG ignores this (lossless). */
  quality: number;

  /** Target format. Empty string = keep original format. */
  targetFormat: string;

  /** Optional max width in pixels (aspect ratio preserved) */
  maxWidth: number | null;

  /** Optional max height in pixels (aspect ratio preserved) */
  maxHeight: number | null;
}

/** Server health status */
export interface HealthStatus {
  status: "online" | "offline" | "checking";
  supportedFormats?: string[];
}
