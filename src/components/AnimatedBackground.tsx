/**
 * AnimatedBackground Component
 * =============================
 * A purely decorative full-screen canvas that renders animated
 * floating orbs using CSS animations and SVG filters.
 *
 * HOW IT WORKS:
 *   - Multiple absolutely-positioned divs with blur filters
 *   - Each orb animates on its own keyframe path (CSS @keyframes)
 *   - An SVG <feTurbulence> filter adds organic noise texture
 *   - The whole thing is fixed behind all other content (z-index: 0)
 *
 * WHY A SEPARATE COMPONENT?
 *   Separation of concerns — the background is visual chrome,
 *   completely independent of the app logic.
 */

export function AnimatedBackground() {
  const orbs = [
    { size: 600, top: "-10%", left: "-10%", color: "#6366f1", delay: "0s", duration: "2s" },
    { size: 500, top: "60%",  left: "70%",  color: "#8b5cf6", delay: "-2s", duration: "2s" },
    { size: 400, top: "30%",  left: "40%",  color: "#a78bfa", delay: "-3s", duration: "1s" },
    { size: 350, top: "75%",  left: "10%",  color: "#4f46e5", delay: "-2s", duration: "2s" },
    { size: 300, top: "10%",  left: "75%",  color: "#7c3aed", delay: "-2s", duration: "3s" },
  ];

  return (
    <>
      {/* Full-screen fixed background container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          background: "linear-gradient(135deg, #0f0c29 0%, #13102e 50%, #0d0b22 100%)",
        }}
      >
        {/* Noise grain overlay using an SVG filter */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
          <filter id="noise">
            {/*
              feTurbulence generates Perlin noise — an organic, cloud-like texture.
              baseFrequency controls the "zoom" of the noise pattern.
              numOctaves adds detail layers (higher = more complex noise).
            */}
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        {/* Animated orbs — each is a blurred div that drifts around */}
        {orbs.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width:  orb.size,
              height: orb.size,
              top:    orb.top,
              left:   orb.left,
              borderRadius: "50%",
              background: orb.color,
              opacity: 0.15,
              // blur() creates the soft glow. A large blur radius on a circle = glowing orb.
              filter: `blur(${orb.size * 0.4}px)`,
              // CSS custom animation (keyframes defined in index.css)
              animation: `float${i % 3} ${orb.duration} ${orb.delay} ease-in-out infinite alternate`,
            }}
          />
        ))}

        {/* Grid lines overlay for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* CSS keyframe animations injected into the page */}
      <style>{`
        @keyframes float0 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(80px, 60px) scale(1.15); }
        }
        @keyframes float1 {
          from { transform: translate(0, 0) rotate(0deg); }
          to   { transform: translate(-60px, 80px) rotate(20deg); }
        }
        @keyframes float2 {
          from { transform: translate(0, 0) scale(1) rotate(0deg); }
          to   { transform: translate(40px, -70px) scale(1.2) rotate(-15deg); }
        }
      `}</style>
    </>
  );
}
