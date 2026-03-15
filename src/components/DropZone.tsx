/**
 * DropZone Component
 * ==================
 * Handles all file input methods:
 *   1. Drag-and-drop (HTML5 Drag & Drop API)
 *   2. Click-to-browse (hidden <input type="file">)
 *   3. Paste from clipboard (Ctrl+V / Cmd+V)
 *
 * HOW DRAG & DROP WORKS (Browser API):
 *   The browser fires four drag events on a drop target element:
 *   - onDragEnter  → pointer enters the target zone
 *   - onDragOver   → pointer moves over the zone (must call e.preventDefault() here
 *                    or the browser won't allow a drop!)
 *   - onDragLeave  → pointer leaves the zone
 *   - onDrop       → user releases the mouse button
 *
 *   e.dataTransfer.files → the FileList from the drag source
 *   We convert it to Array<File> with Array.from() for easier handling.
 *
 * PROPS:
 *   onFilesAdded(files) — called with valid image File[] after any input method
 */

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesAdded, disabled = false }: DropZoneProps) {
  // isDragging tracks whether a drag is actively over this zone (for visual feedback)
  const [isDragging, setIsDragging] = useState(false);

  // useRef gives us a stable reference to the hidden <input> DOM element
  // so we can programmatically click it (open file picker) from our custom button.
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Drag event handlers ────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default browser behavior (open file)
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // REQUIRED — without this, onDrop won't fire
    e.stopPropagation();
    if (!disabled) e.dataTransfer.dropEffect = "copy"; // Show a "copy" cursor icon
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // relatedTarget is the element the pointer moved TO.
    // If it's outside our drop zone, reset the dragging state.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    // e.dataTransfer.files is a FileList (not an Array).
    // We spread it into a regular Array for .filter() etc.
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesAdded(files);
  }, [disabled, onFilesAdded]);

  // ── File input change handler ──────────────────────────────────────────
  // Fires when user selects files via the native file picker dialog
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFilesAdded(files);
    // Reset input value so the same file can be re-selected
    e.target.value = "";
  }, [onFilesAdded]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? "#818cf8" : "rgba(99,102,241,0.4)"}`,
        borderRadius: "20px",
        padding: "60px 40px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        background: isDragging
          ? "rgba(99,102,241,0.12)"
          : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        transform: isDragging ? "scale(1.01)" : "scale(1)",
        boxShadow: isDragging
          ? "0 0 40px rgba(99,102,241,0.3), inset 0 0 40px rgba(99,102,241,0.05)"
          : "none",
      }}
    >
      {/* Hidden native file input — triggered programmatically */}
      <input
        ref={inputRef}
        type="file"
        multiple          // Allow selecting multiple files at once
        accept="image/*"  // Filter file picker to image types only
        style={{ display: "none" }}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Drop icon — animated when dragging */}
      <div style={{
        fontSize: "64px",
        marginBottom: "16px",
        transition: "transform 0.3s ease",
        transform: isDragging ? "translateY(-8px) scale(1.1)" : "none",
        filter: isDragging ? "drop-shadow(0 0 20px #818cf8)" : "none",
      }}>
        {isDragging ? "📂" : "🖼️"}
      </div>

      <p style={{
        fontSize: "1.2rem",
        fontWeight: 600,
        color: isDragging ? "#a5b4fc" : "#e2e8f0",
        marginBottom: "8px",
        fontFamily: "'Sora', sans-serif",
      }}>
        {isDragging ? "Release to add images" : "Drop images here"}
      </p>

      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        or click to browse &nbsp;·&nbsp; JPG, PNG, WEBP, BMP, GIF, TIFF
      </p>
    </div>
  );
}
