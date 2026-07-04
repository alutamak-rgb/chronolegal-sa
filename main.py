"""
ChronoLegal AI — South Africa Edition
FastAPI backend: PDF upload → DeepSeek analysis → Discrepancy Matrix
"""

import os
import logging
import time
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("chronolegal")

from extract import analyze_case_bundle, generate_matrix_excel

app = FastAPI(title="ChronoLegal AI — SA Edition")

# ── SECURITY HEADERS ──────────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self' https://api.deepseek.com; "
        "frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

# ── RATE LIMITING ─────────────────────────────────────────────────────────
_rate_store: dict[str, tuple[int, float]] = {}

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path in ("/analyze", "/api/analyze"):
        key = request.client.host if request.client else "unknown"
        now = time.time()
        count, reset = _rate_store.get(key, (0, now + 60))
        if now > reset:
            count, reset = 0, now + 60
        count += 1
        _rate_store[key] = (count, reset)
        if count > 5:  # 5 analyses per minute max
            return JSONResponse(
                {"error": "Too many requests. Please wait a minute."},
                status_code=429,
            )
    return await call_next(request)

# ── OPTIONAL API KEY AUTH ─────────────────────────────────────────────────
API_KEY = os.environ.get("CHRONOLEGAL_API_KEY", "")
security = HTTPBearer(auto_error=False)

async def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if not API_KEY:
        return  # no auth configured — open access
    if not credentials or credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

# ── STATIC FILES ──────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

def _read_html(filename: str) -> HTMLResponse:
    with open(f"static/{filename}", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.get("/")
async def landing():
    return _read_html("index.html")

@app.get("/tool")
async def tool():
    return _read_html("tool.html")

# ── HEALTH CHECK ──────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ChronoLegal AI — SA Edition"}

# ── ANALYSE ENDPOINT ──────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze_case(
    hospital: UploadFile = File(...),
    expert_a: UploadFile = File(...),
    expert_b: UploadFile = File(...),
    case_name: str = Form(default=""),
    output_format: str = Form(default="json"),
    _auth=Depends(require_auth),
):
    """
    Upload 3 PDFs (hospital record + 2 expert reports) and get a discrepancy matrix.
    
    output_format:
      - "json" → returns the matrix as JSON
      - "excel" → returns an Excel spreadsheet
    """
    # Validate all files present
    for file, label in [(hospital, "Hospital Record"), (expert_a, "Expert Report A"), (expert_b, "Expert Report B")]:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail=f"{label} is required.")
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file

    pdfs = []
    for file, label in [(hospital, "Hospital Record"), (expert_a, "Expert Report A"), (expert_b, "Expert Report B")]:
        content_length = file.headers.get("content-length")
        if content_length and int(content_length) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds 50MB limit.")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds 50MB limit.")

        pdfs.append((content, file.filename))

    logger.info(f"Analysing case '{case_name}' — hospital: {pdfs[0][1]}, expert A: {pdfs[1][1]}, expert B: {pdfs[2][1]}")

    try:
        result = analyze_case_bundle(
            hospital_pdf=pdfs[0],
            expert_a_pdf=pdfs[1],
            expert_b_pdf=pdfs[2],
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        logger.error(f"DeepSeek analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed. Please try again. Error: {str(e)[:200]}")

    timeline = result.get("timeline", [])
    if not timeline:
        raise HTTPException(status_code=422, detail="No discrepancies could be identified from the documents.")

    label = case_name.strip() if case_name.strip() else "case_analysis"
    safe_label = label.replace(" ", "_").replace("/", "-")

    if output_format == "excel":
        buffer = generate_matrix_excel(result, label)
        filename = f"discrepancy_matrix_{safe_label}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        logger.info(f"Generated Excel with {len(timeline)} entries → {filename}")
        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    # Default: return JSON
    logger.info(f"Returning JSON matrix with {len(timeline)} entries")
    return JSONResponse(result)


# ── SIMPLE ANALYSE (JSON-only, no auth required for MVP) ───────────────────
@app.post("/api/analyze")
async def analyze_case_api(
    hospital: UploadFile = File(...),
    expert_a: UploadFile = File(...),
    expert_b: UploadFile = File(...),
    case_name: str = Form(default=""),
):
    """Same as /analyze but always returns JSON and uses simpler error responses."""
    MAX_FILE_SIZE = 50 * 1024 * 1024

    pdfs = []
    for file in [hospital, expert_a, expert_b]:
        if not file or not file.filename or not file.filename.lower().endswith(".pdf"):
            return JSONResponse({"error": "All three PDF files are required."}, status_code=400)

        content_length = file.headers.get("content-length")
        if content_length and int(content_length) > MAX_FILE_SIZE:
            return JSONResponse({"error": f"{file.filename} exceeds 50MB limit."}, status_code=400)

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            return JSONResponse({"error": f"{file.filename} exceeds 50MB limit."}, status_code=400)

        pdfs.append((content, file.filename))

    try:
        result = analyze_case_bundle(
            hospital_pdf=pdfs[0],
            expert_a_pdf=pdfs[1],
            expert_b_pdf=pdfs[2],
        )
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=422)
    except RuntimeError as e:
        logger.error(f"DeepSeek API error: {e}")
        return JSONResponse({"error": "AI analysis failed. Please try again."}, status_code=502)

    return JSONResponse(result)
