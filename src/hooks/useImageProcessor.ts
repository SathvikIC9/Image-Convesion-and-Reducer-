/**
 * useImageProcessor — Custom React Hook
 * ======================================
 * A "custom hook" is a reusable function that encapsulates stateful logic.
 * By convention, hook names start with "use".
 *
 * WHY HOOKS?
 *   Instead of scattering useState/useCallback calls inside components,
 *   we group all image-processing logic here. The component stays clean —
 *   it just calls useImageProcessor() and gets back state + actions.
 *
 * WHAT THIS HOOK MANAGES:
 *   - The list of queued images (ImageFile[])
 *   - Processing options (quality, format, resize)
 *   - Server health status
 *   - Add / remove / process / clear images
 */

import { useState, useCallback, useEffect } from "react";
import type { ImageFile, ProcessingOptions, HealthStatus } from "../types";
import { processImage, checkHealth } from "../utils/api";

export function useImageProcessor() {
  // ── State ──────────────────────────────────────────────────────────────
  // useState<T>(initial) returns [currentValue, setterFunction]
  // React re-renders the component whenever a setter is called.

  const [images, setImages] = useState<ImageFile[]>([]);

  const [options, setOptions] = useState<ProcessingOptions>({
    quality: 85,
    targetFormat: "",
    maxWidth: null,
    maxHeight: null,
  });

  const [health, setHealth] = useState<HealthStatus>({ status: "checking" });

  // ── Health Check on Mount ──────────────────────────────────────────────
  // useEffect(fn, []) runs fn once after the first render — like componentDidMount.
  // The empty array [] means "no dependencies" → runs once only.
  useEffect(() => {
    checkHealth().then(setHealth);
    // Re-check every 30 seconds to detect server restarts
    const interval = setInterval(() => checkHealth().then(setHealth), 30_000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // ── addImages() ────────────────────────────────────────────────────────
  // Called when user drops files or clicks the file input.
  // useCallback memoizes the function so it's not recreated on every render.
  // The dependency array [images] means: recreate if `images` changes.
  const addImages = useCallback(
    (files: File[]) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif", "image/tiff"];

      const newImages: ImageFile[] = files
        .filter((f) => validTypes.includes(f.type))
        .filter((f) => !images.some((img) => img.file.name === f.name && img.file.size === f.size))
        .map((file) => ({
          id: crypto.randomUUID(), // Browser-native UUID generation
          file,
          previewUrl: URL.createObjectURL(file), // Temporary object URL for <img> preview
          status: "pending" as const,
        }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [images]
  );

  // ── removeImage() ──────────────────────────────────────────────────────
  // Removes one image by ID. Also revokes its object URL to free memory.
  // URL.createObjectURL leaks memory if not cleaned up.
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result) URL.revokeObjectURL(target.result.downloadUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // ── processAll() ──────────────────────────────────────────────────────
  // Processes all "pending" images sequentially.
  // Uses functional setState updates to avoid stale closures.
  const processAll = useCallback(async () => {
    const pending = images.filter((img) => img.status === "pending");

    for (const img of pending) {
      // Mark as "processing" → triggers spinner in UI
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: "processing" } : i))
      );

      try {
        const result = await processImage(img.file, options);

        // Mark as "done" with results → triggers success UI
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: "done", result } : i
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";

        // Mark as "error" → triggers error UI
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: "error", errorMessage: msg } : i
          )
        );
      }
    }
  }, [images, options]);

  // ── clearAll() ────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.result) URL.revokeObjectURL(img.result.downloadUrl);
    });
    setImages([]);
  }, [images]);

  // ── Expose state & actions ─────────────────────────────────────────────
  return {
    images,
    options,
    setOptions,
    health,
    addImages,
    removeImage,
    processAll,
    clearAll,
    hasPending: images.some((i) => i.status === "pending"),
    isProcessing: images.some((i) => i.status === "processing"),
  };
}
