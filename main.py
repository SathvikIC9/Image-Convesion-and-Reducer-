"""
IMAGE REDUCER & CONVERTER - FastAPI Backend
============================================
This is the core backend server that handles:
  1. Image compression (reducing file size)
  2. Image format conversion (JPG → PNG → WEBP → BMP, etc.)
  3. CORS handling (allows the React frontend to talk to this server)
  4. File validation and error handling

HOW IT WORKS:
  - Client sends a POST request with an image file + options (quality, target format)
  - FastAPI receives it, Pillow processes the image
  - The compressed/converted image is sent back as a downloadable response
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
import io
import os
from typing import Optional

# ─────────────────────────────────────────────
# APP INITIALIZATION
# ─────────────────────────────────────────────
# FastAPI is a modern, high-performance web framework for Python.
# It automatically generates API docs at http://localhost:8000/docs
app = FastAPI(
    title="Image Reducer & Converter API",
    description="Compress and convert images with ease",
    version="1.0.0"
)

# ─────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# Without this, browsers BLOCK requests from one origin (React at :5173)
# to another origin (FastAPI at :8000). This middleware says "allow it".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],   # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # Allow all HTTP headers
)

# ─────────────────────────────────────────────
# SUPPORTED FORMATS
# ─────────────────────────────────────────────
# Maps user-friendly format names → Pillow save format + MIME type for HTTP response
SUPPORTED_FORMATS = {
    "jpeg": {"pillow_format": "JPEG", "mime": "image/jpeg", "ext": "jpg"},
    "jpg":  {"pillow_format": "JPEG", "mime": "image/jpeg", "ext": "jpg"},
    "png":  {"pillow_format": "PNG",  "mime": "image/png",  "ext": "png"},
    "webp": {"pillow_format": "WEBP", "mime": "image/webp", "ext": "webp"},
    "bmp":  {"pillow_format": "BMP",  "mime": "image/bmp",  "ext": "bmp"},
    "gif":  {"pillow_format": "GIF",  "mime": "image/gif",  "ext": "gif"},
    "tiff": {"pillow_format": "TIFF", "mime": "image/tiff", "ext": "tiff"},
    "ico":  {"pillow_format": "ICO",  "mime": "image/x-icon", "ext": "ico"},
}

MAX_FILE_SIZE_MB = 50  # Reject files larger than 50 MB


# ─────────────────────────────────────────────
# HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────
# Simple endpoint to verify the server is running.
# React app calls GET /health on startup to show server status.
@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "supported_formats": list(SUPPORTED_FORMATS.keys())
    }


# ─────────────────────────────────────────────
# MAIN PROCESSING ENDPOINT
# ─────────────────────────────────────────────
# This is the workhorse endpoint. Accepts multipart/form-data POST requests.
#
# Parameters:
#   file          → The uploaded image (UploadFile = FastAPI wrapper around file bytes)
#   quality       → 1–100, controls JPEG/WEBP compression (higher = better quality, bigger file)
#   target_format → Output format string e.g. "png", "webp"
#   max_width     → Optional: resize image to this max width (preserves aspect ratio)
#   max_height    → Optional: resize image to this max height (preserves aspect ratio)
@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    quality: int = Form(default=85),
    target_format: str = Form(default=""),
    max_width: Optional[int] = Form(default=None),
    max_height: Optional[int] = Form(default=None),
):
    # ── Step 1: Validate file size ──
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.1f} MB. Max allowed: {MAX_FILE_SIZE_MB} MB"
        )

    # ── Step 2: Open image with Pillow ──
    # Pillow (PIL Fork) is a Python imaging library. It reads raw bytes from io.BytesIO
    # (an in-memory byte stream — no disk I/O needed).
    try:
        image = Image.open(io.BytesIO(contents))
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="File is not a valid image")

    # Detect original format
    original_format = (image.format or "JPEG").lower()
    original_ext = original_format if original_format != "jpeg" else "jpg"

    # ── Step 3: Determine output format ──
    out_fmt = (target_format.lower().strip() or original_format)
    if out_fmt not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{out_fmt}'. Supported: {list(SUPPORTED_FORMATS.keys())}"
        )
    fmt_info = SUPPORTED_FORMATS[out_fmt]

    # ── Step 4: Color mode conversion ──
    # JPEG does not support transparency (alpha channel).
    # If converting a PNG with transparency → JPEG, we must flatten it onto white.
    # "RGBA" = Red, Green, Blue, Alpha  |  "RGB" = Red, Green, Blue (no alpha)
    if fmt_info["pillow_format"] == "JPEG":
        if image.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            background.paste(image, mask=image.split()[-1] if image.mode in ("RGBA", "LA") else None)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")
    elif fmt_info["pillow_format"] == "PNG":
        if image.mode not in ("RGB", "RGBA", "L", "P"):
            image = image.convert("RGBA")
    else:
        # For BMP, GIF, TIFF — convert to RGB to be safe
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

    # ── Step 5: Resize (optional) ──
    # Uses LANCZOS resampling — a high-quality downsampling filter.
    # thumbnail() is smart: it preserves aspect ratio and never upscales.
    if max_width or max_height:
        target_w = max_width or image.width
        target_h = max_height or image.height
        image.thumbnail((target_w, target_h), Image.LANCZOS)

    # ── Step 6: Compress & encode to bytes ──
    output_buffer = io.BytesIO()
    save_kwargs = {}

    if fmt_info["pillow_format"] == "JPEG":
        # quality: 1 (tiny, ugly) → 95 (big, beautiful). Above 95 rarely helps.
        # optimize=True: tells Pillow to spend extra time finding the smallest encoding
        save_kwargs = {"quality": min(max(quality, 1), 95), "optimize": True}
    elif fmt_info["pillow_format"] == "WEBP":
        save_kwargs = {"quality": min(max(quality, 1), 100), "method": 6}
    elif fmt_info["pillow_format"] == "PNG":
        # PNG is lossless — quality doesn't apply. compress_level 1–9 (higher = smaller but slower).
        save_kwargs = {"optimize": True}

    image.save(output_buffer, format=fmt_info["pillow_format"], **save_kwargs)
    output_bytes = output_buffer.getvalue()

    # ── Step 7: Build filename for the download ──
    base_name = os.path.splitext(file.filename or "image")[0]
    output_filename = f"{base_name}_compressed.{fmt_info['ext']}"

    # ── Step 8: Return the processed image as HTTP response ──
    # Content-Disposition: attachment → browser triggers a file download
    return Response(
        content=output_bytes,
        media_type=fmt_info["mime"],
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "X-Original-Size": str(len(contents)),
            "X-Compressed-Size": str(len(output_bytes)),
            "X-Original-Format": original_ext,
            "X-Output-Format": fmt_info["ext"],
            "X-Image-Width": str(image.width),
            "X-Image-Height": str(image.height),
            "Access-Control-Expose-Headers": "X-Original-Size,X-Compressed-Size,X-Original-Format,X-Output-Format,X-Image-Width,X-Image-Height",
        }
    )


# ─────────────────────────────────────────────
# BATCH PROCESSING INFO ENDPOINT
# ─────────────────────────────────────────────
# Returns metadata about a single image without processing it.
@app.post("/info")
async def image_info(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        return {
            "filename": file.filename,
            "format": image.format,
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "size_bytes": len(contents),
            "size_kb": round(len(contents) / 1024, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
