/**
 * App Component — Root of the React Application
 * ===============================================
 * This is the top-level component that composes everything together.
 *
 * COMPONENT TREE:
 *   <App>
 *     <AnimatedBackground />    ← Fixed decorative background
 *     <Header />                ← Top bar with health status
 *     <main>
 *       <DropZone />            ← File input (drag/drop/click)
 *       <ControlPanel />        ← Settings + process button
 *       image grid              ← <ImageCard /> for each queued image
 *     </main>
 *
 * DATA FLOW (one-way, React's model):
 *   useImageProcessor() → state lives here at the top
 *   State is passed DOWN as props to child components (read-only for them)
 *   Children call callback props (onProcess, onRemove, etc.) to request changes
 *   Hook updates state → React re-renders the whole tree
 *
 * WHY ONE-WAY DATA FLOW?
 *   It makes the app predictable. Data always travels parent → child.
 *   Events always travel child → parent via callbacks.
 *   Debugging is simple: trace state up to useImageProcessor.
 */

import { AnimatedBackground } from "./components/AnimatedBackground";
import { Header } from "./components/Header";
import { DropZone } from "./components/DropZone";
import { ControlPanel } from "./components/ControlPanel";
import { ImageCard } from "./components/ImageCard";
import { useImageProcessor } from "./hooks/useImageProcessor";

export default function App() {
  // All state and logic lives in this custom hook.
  // The App component is purely structural — it just wires components together.
  const {
    images,
    options,
    setOptions,
    health,
    addImages,
    removeImage,
    processAll,
    clearAll,
    hasPending,
    isProcessing,
  } = useImageProcessor();

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Layer 0: Animated background (fixed, behind everything) */}
      <AnimatedBackground />

      {/* Layer 1: App content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Header health={health} />

        <main style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}>
          {/* ── Hero text ── */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)", // fluid font size
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}>
              Compress & Convert{" "}
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Images
              </span>
            </h2>
            <p style={{
              color: "#64748b",
              fontSize: "1.1rem",
              maxWidth: "500px",
              margin: "0 auto",
            }}>
              Reduce file size, change format, resize — all in your browser, powered by Python.
            </p>
          </div>

          {/* ── Two-column layout: DropZone + Controls ── */}
          <div style={{
            display: "grid",
            // On wide screens: 2fr (drop zone) | 1fr (controls)
            // On narrow screens: single column
            gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)",
            gap: "24px",
            marginBottom: "40px",
          }}
          className="main-grid"
          >
            <DropZone onFilesAdded={addImages} disabled={isProcessing} />
            <ControlPanel
              options={options}
              setOptions={setOptions}
              onProcess={processAll}
              onClear={clearAll}
              hasPending={hasPending}
              isProcessing={isProcessing}
            />
          </div>

          {/* ── Image Grid ── */}
          {images.length > 0 && (
            <section>
              {/* Stats bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
                padding: "12px 20px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
                {["pending", "processing", "done", "error"].map((s) => {
                  const count = images.filter((i) => i.status === s).length;
                  if (!count) return null;
                  const colors: Record<string, string> = {
                    pending: "#94a3b8", processing: "#6366f1", done: "#10b981", error: "#ef4444"
                  };
                  return (
                    <span key={s} style={{ color: colors[s], fontSize: "0.8rem", fontWeight: 600 }}>
                      {count} {s}
                    </span>
                  );
                })}
              </div>

              {/*
                CSS Grid for the image cards.
                auto-fill: create as many columns as fit.
                minmax(240px, 1fr): each column is at least 240px, at most equal share.
                This makes the grid automatically responsive with no media queries.
              */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "16px",
              }}>
                {images.map((image) => (
                  <ImageCard
                    key={image.id}    // React needs a stable key to track list items
                    image={image}
                    onRemove={removeImage}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {images.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#334155" }}>
              <p style={{ fontSize: "0.9rem" }}>Drop some images above to get started ↑</p>
            </div>
          )}
        </main>
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
