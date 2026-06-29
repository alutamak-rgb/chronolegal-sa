import os
import logging
import time
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("chronolegal")

from extract import extract_chronology_from_pdfs, generate_excel, generate_word

app = FastAPI(title="ChronoLegal AI")

# ── SECURITY HEADERS ──────────────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

# ── RATE LIMITING ─────────────────────────────────────────────────────────────
_rate_store: dict[str, tuple[int, float]] = {}

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path == "/process":
        key = request.client.host if request.client else "unknown"
        now = time.time()
        count, reset = _rate_store.get(key, (0, now + 60))
        if now > reset:
            count, reset = 0, now + 60
        count += 1
        _rate_store[key] = (count, reset)
        if count > 10:
            return HTMLResponse("Too many requests. Try again in a minute.", status_code=429)
    return await call_next(request)

# ── API KEY AUTH ──────────────────────────────────────────────────────────────
API_KEY = os.environ.get("CHRONOLEGAL_API_KEY", "")
security = HTTPBearer(auto_error=False)

async def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if not API_KEY:
        return  # no auth configured — open access
    if not credentials or credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

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

@app.post("/process")
async def process_pdfs(
    files: List[UploadFile] = File(...),
    case_name: str = Form(default=""),
    output_format: str = Form(default="excel"),
    _auth=Depends(require_auth),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    MAX_PAGES = 500                    # total across all PDFs
    all_pdf_data = []

    for file in files:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename or 'Unknown file'} is not a PDF.")

        # Check content-length header before reading
        content_length = file.headers.get("content-length")
        if content_length and int(content_length) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds 50MB limit.")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds 50MB limit.")

        all_pdf_data.append((content, file.filename))

    logger.info(f"Processing {len(all_pdf_data)} PDF(s) for case '{case_name}'")
    events = extract_chronology_from_pdfs(all_pdf_data, max_pages=MAX_PAGES)

    if not events:
        raise HTTPException(status_code=422, detail="No medical events could be extracted.")

    label = case_name.strip() if case_name.strip() else (
        all_pdf_data[0][1].replace(".pdf", "") if len(all_pdf_data) == 1 else "medical_records"
    )
    safe_label = label.replace(" ", "_").replace("/", "-")

    if output_format == "word":
        buffer = generate_word(events, label)
        filename = f"chronology_{safe_label}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        buffer = generate_excel(events, label)
        filename = f"chronology_{safe_label}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    logger.info(f"Generated {output_format} with {len(events)} events → {filename}")
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
