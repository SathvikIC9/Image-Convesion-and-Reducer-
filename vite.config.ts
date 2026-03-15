/**
 * vite.config.ts — Vite Build Tool Configuration
 * ================================================
 * Vite is a next-generation frontend build tool that provides:
 *   - Instant dev server startup (uses native ES modules in the browser)
 *   - Hot Module Replacement (HMR): saves file → browser updates instantly
 *   - Optimized production builds (Rollup under the hood)
 *
 * @vitejs/plugin-react:
 *   Adds React-specific transforms: JSX → JS, React Fast Refresh (HMR for React).
 *
 * server.proxy:
 *   During development, /api/* requests are proxied to the FastAPI server.
 *   This avoids CORS issues in dev and lets us use relative URLs.
 *   Example: fetch('/api/process') → http://localhost:8000/process
 *   (We're not using this in the app — keeping it as an example.)
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
