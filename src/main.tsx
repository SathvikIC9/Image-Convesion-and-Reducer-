/**
 * main.tsx — React Entry Point
 * =============================
 * This is the very first JavaScript file the browser executes.
 *
 * HOW REACT MOUNTS:
 *   1. index.html has a <div id="root"></div> (empty shell)
 *   2. Vite bundles this file and injects a <script> tag into index.html
 *   3. ReactDOM.createRoot() takes control of the #root div
 *   4. .render(<App />) converts the JSX component tree into real DOM nodes
 *   5. After this point, React manages ALL DOM updates inside #root
 *
 * StrictMode:
 *   React.StrictMode wraps the app in development only.
 *   It double-invokes renders and effects to surface bugs early.
 *   It has zero impact on production builds.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
