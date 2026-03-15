A full-stack web application to **compress** and **convert** images.
Built with **Python (FastAPI + Pillow)** on the backend and **TypeScript + React + Vite** on the frontend.

---

## 📁 Project Structure

```
image-reducer/
├── backend/
│   ├── main.py              ← FastAPI server (all image processing logic)
│   └── requirements.txt     ← Python dependencies
│
└── frontend/
    ├── index.html           ← HTML shell (React mounts here)
    ├── package.json         ← Node dependencies & scripts
    ├── vite.config.ts       ← Vite build tool config
    ├── tsconfig.json        ← TypeScript compiler config
    └── src/
        ├── main.tsx         ← React entry point
        ├── App.tsx          ← Root component (layout + wiring)
        ├── index.css        ← Global styles + font import
        ├── types/
        │   └── index.ts     ← TypeScript interfaces (ImageFile, ProcessingOptions…)
        ├── utils/
        │   └── api.ts       ← All HTTP fetch calls to the backend
        ├── hooks/
        │   └── useImageProcessor.ts  ← Custom React hook (all app state)
        └── components/
            ├── AnimatedBackground.tsx  ← Decorative animated background
            ├── Header.tsx              ← Top bar + server health indicator
            ├── DropZone.tsx            ← Drag & drop / click-to-browse input
            ├── ControlPanel.tsx        ← Quality slider, format selector, resize
            └── ImageCard.tsx           ← Per-image status card + download button
```

---

## 🚀 Setup & Running

### Backend (Python)

```bash
cd image-reducer/backend

# Create a virtual environment (isolated Python sandbox)
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-reloads on file save)
uvicorn main:app --reload --port 8000
```

Backend is now running at: **http://localhost:8000**
API docs (auto-generated): **http://localhost:8000/docs**

---

### Frontend (TypeScript + React)

```bash
cd image-reducer/frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

Frontend is now running at: **http://localhost:5173**

---

## 🧠 How Each Component Works — Deep Dive

---

### 🐍 Backend: `main.py`

**What it is:** A Python HTTP server built with FastAPI.

**Key libraries:**
| Library | Role |
|---------|------|
| `FastAPI` | Web framework — defines HTTP routes, handles request parsing, auto-generates docs |
| `Uvicorn` | ASGI server — runs FastAPI, handles actual TCP connections |
| `Pillow (PIL)` | Image processing — opens, transforms, compresses, and saves images |
| `python-multipart` | Parses `multipart/form-data` bodies (needed for file uploads) |

**Request lifecycle for `POST /process`:**
```
Browser sends FormData (file + options)
    ↓
FastAPI parses the multipart body
    ↓
main.py reads the file bytes into io.BytesIO (in-memory, no disk writes)
    ↓
Pillow opens the image from those bytes
    ↓
Mode conversion (RGBA → RGB if JPEG target, etc.)
    ↓
Optional resize with LANCZOS resampling
    ↓
Pillow saves the result into another BytesIO buffer
    ↓
FastAPI returns the bytes as an HTTP Response
with custom headers (X-Original-Size, X-Compressed-Size, etc.)
```

**Why `io.BytesIO`?**
Instead of writing temp files to disk, we use Python's `io.BytesIO` — an in-memory byte buffer. This is faster, avoids disk I/O, and leaves no temp files behind.

**CORS middleware:**
When the browser (at `localhost:5173`) calls the API (at `localhost:8000`), they're on different "origins". Without CORS headers, the browser blocks the response. `CORSMiddleware` adds the required `Access-Control-Allow-Origin` headers to every response.

---

### ⚛️ Frontend Architecture

React is a **component-based UI library**. The entire UI is a tree of components. Each component is a function that returns JSX (HTML-like syntax that compiles to `React.createElement()` calls).

**State management pattern used: "lifting state up"**
All state lives in the custom hook `useImageProcessor`. Components are "dumb" — they receive props and call callback functions. This makes components reusable and testable.

---

### 📄 `types/index.ts`

**What it is:** TypeScript interface definitions — the "contracts" of the app.

```typescript
interface ImageFile {
  id: string;
  file: File;           // Browser File object
  previewUrl: string;   // blob: URL for <img src>
  status: "pending" | "processing" | "done" | "error";
  result?: ProcessingResult;
}
```

TypeScript uses these at **compile time** — it will refuse to compile if you pass the wrong shape of data to a component. This catches an entire class of bugs before you ever run the code.

---

### 🔌 `utils/api.ts`

**What it is:** The HTTP client layer. Every `fetch()` call lives here.

**`FormData` explained:**
```typescript
const formData = new FormData();
formData.append("file", file);        // binary file
formData.append("quality", "85");     // strings only
```
`FormData` builds a `multipart/form-data` encoded body — the standard format for HTTP file uploads. The `Content-Type` header is set automatically by the browser with the correct boundary string.

**Blob URLs explained:**
```typescript
const blob = await response.blob();             // raw bytes from server
const downloadUrl = URL.createObjectURL(blob);  // → "blob:http://localhost:5173/uuid"
```
`URL.createObjectURL()` creates a temporary in-browser URL that points to the raw bytes. This URL works for `<img src>`, `<a href download>`, and `<video src>`. It lives only in the current tab — you must call `URL.revokeObjectURL()` when done to free memory.

---

### 🎣 `hooks/useImageProcessor.ts`

**What it is:** A custom React hook — a function that uses React's built-in hooks (`useState`, `useEffect`, `useCallback`) to manage all app state.

**Why a custom hook?**
Without it, all this logic would live inside `App.tsx`, making it hundreds of lines long and hard to test. The hook pattern extracts stateful logic into a self-contained, reusable function.

**Key React hooks used:**

| Hook | Purpose |
|------|---------|
| `useState<T>(initial)` | Declares a piece of reactive state. Returns `[value, setter]`. Calling the setter triggers a re-render. |
| `useEffect(fn, deps)` | Runs a side effect after render. Empty `[]` deps = runs once on mount (like componentDidMount). Returns a cleanup function. |
| `useCallback(fn, deps)` | Memoizes a function — returns the same function reference unless deps change. Prevents unnecessary re-renders of child components. |

**Functional state updates:**
```typescript
setImages(prev => prev.map(i =>
  i.id === img.id ? { ...i, status: "processing" } : i
))
```
We pass a function (not a value) to `setImages`. This guarantees we're working with the latest state, avoiding **stale closure** bugs — a common React pitfall where an event handler captures an old copy of state.

---

### 🎨 `components/AnimatedBackground.tsx`

**What it is:** A decorative full-screen background with animated glowing orbs.

**Techniques used:**

1. **CSS `filter: blur()`** — Blurring a colored circle with a large radius creates a "glow" effect.

2. **CSS `@keyframes`** — Defines an animation timeline. The browser interpolates between keyframe values.
   ```css
   @keyframes float0 {
     from { transform: translate(0, 0); }
     to   { transform: translate(80px, 60px); }
   }
   ```

3. **`animation-direction: alternate`** — Makes the animation play forwards then backwards, creating smooth back-and-forth motion without abrupt jumps.

4. **SVG `<feTurbulence>`** — Generates Perlin noise, an organic pseudo-random pattern. When applied as a texture overlay it adds a subtle grain/film effect.

5. **`position: fixed`** — The background stays in place even when the page scrolls.

---

### 📥 `components/DropZone.tsx`

**What it is:** The file input component. Handles three input methods.

**HTML5 Drag & Drop API:**

The browser fires these events on a drop target element:
```
onDragEnter  → pointer enters the zone (show visual feedback)
onDragOver   → pointer moves over zone (MUST call e.preventDefault() here)
onDragLeave  → pointer exits the zone (remove visual feedback)
onDrop       → user releases mouse (read e.dataTransfer.files)
```

**Why `e.preventDefault()` in `onDragOver`?**
The browser's default behavior for drag-over is "don't allow a drop here". Calling `preventDefault()` tells the browser "yes, this element accepts drops". Without it, `onDrop` never fires.

**`e.dataTransfer.files`** is a `FileList` — a live DOM object, not a regular array. We convert it with `Array.from()` to use `.filter()`, `.map()`, etc.

**Hidden input trick:**
```tsx
<input ref={inputRef} type="file" style={{ display: "none" }} />
<div onClick={() => inputRef.current?.click()}>...</div>
```
We hide the ugly native file input but keep it functional. Clicking our styled div programmatically clicks the hidden input, which opens the system file picker.

**`useRef`** gives us a stable reference to the DOM node across renders. Unlike a variable, refs survive re-renders without triggering them.

---

### ⚙️ `components/ControlPanel.tsx`

**What it is:** All user settings for image processing.

**Controlled components:**
React has two types of form inputs:
- **Uncontrolled**: DOM manages the value (use `ref` to read it)
- **Controlled**: React manages the value via `state`

We use controlled inputs throughout:
```tsx
<input
  type="range"
  value={options.quality}          // ← React owns this value
  onChange={(e) => update("quality", parseInt(e.target.value))}
/>
```
The `value` prop locks the input to the React state. `onChange` updates the state. This ensures the UI is always a perfect reflection of state — no sync issues.

**Spread update pattern:**
```typescript
const update = (key, value) =>
  setOptions(prev => ({ ...prev, [key]: value }));
```
`{ ...prev }` copies all existing options fields. `[key]: value` uses a computed property name to update exactly one field. This is the idiomatic way to update nested state in React without mutation.

---

### 🃏 `components/ImageCard.tsx`

**What it is:** Displays one image with its processing status and results.

**`objectFit: "cover"`**
CSS property that makes an image fill its container while maintaining aspect ratio. Think of it as "zoom and crop" — no distortion, no letterboxing.

**Programmatic download:**
```typescript
const link = document.createElement("a");
link.href = result.downloadUrl;   // blob: URL
link.download = result.filename;  // triggers download instead of navigation
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```
We create an invisible `<a>` tag, set the `download` attribute (which tells the browser to download, not navigate), click it, then immediately remove it. This is the standard pattern for programmatic file downloads from blob URLs.

**CSS `animation: spin`:**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```
The loading spinner is a div with a partially transparent border. `border-top` is a solid accent color. Spinning the whole div creates the spinner illusion.

---

### 🏗️ `App.tsx`

**What it is:** The root component. It's the composer — it wires all other components together.

**CSS Grid layout:**
```css
grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr)
```
- `2fr` / `1fr` — fractional units. The drop zone gets 2/3 of the space, controls get 1/3.
- `minmax(300px, 1fr)` — the controls column is at least 300px but can grow.

**`repeat(auto-fill, minmax(240px, 1fr))`:**
The image grid's magic formula. `auto-fill` creates as many columns as will fit. `minmax(240px, 1fr)` ensures each card is at least 240px wide but can stretch. This is fully responsive with zero media queries.

**`clamp(2rem, 5vw, 3.5rem)`:**
Fluid typography. The font size is:
- Minimum: `2rem`
- Preferred: `5vw` (5% of viewport width — scales with screen size)
- Maximum: `3.5rem`
No media queries needed for responsive text sizing.

---

## 🌊 Data Flow Summary

```
User drops files
      ↓
DropZone.onDrop → addImages(files)
      ↓
useImageProcessor: creates ImageFile[] with status="pending"
      ↓
ImageCard renders each file (pending state)
      ↓
User clicks "Process All"
      ↓
processAll() → for each pending image:
  1. setStatus("processing") → spinner appears
  2. api.processImage(file, options) → POST /process to FastAPI
  3. FastAPI: Pillow compresses/converts → returns bytes + headers
  4. api.ts: reads blob → creates downloadUrl → returns ProcessingResult
  5. setStatus("done") + attach result → stats + download button appear
```

---

## 🔧 Supported Formats

| Format | Compression | Transparency | Notes |
|--------|-------------|--------------|-------|
| JPEG   | Lossy       | ❌           | Best for photos |
| PNG    | Lossless    | ✅           | Best for graphics/screenshots |
| WEBP   | Lossy/Lossless | ✅        | Modern format, best compression |
| BMP    | None        | ❌           | Uncompressed, large files |
| GIF    | LZW         | ✅ (1-bit)   | Supports animation |
| TIFF   | Various     | ✅           | Professional/archival use |

---

## 💡 Tips

- **WEBP** gives the best file size reduction (typically 25–35% smaller than JPEG at same quality)
- **Quality 85** is the sweet spot for JPEG — visually lossless but much smaller than 95+
- **PNG → WEBP** is a great conversion for web images with transparency
- Max 50 MB per file
- Use **Venv** for better testing experience
