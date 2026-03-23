import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse
from typing import List
from extract import extract_chronology_from_pdfs, generate_excel, generate_word

app = FastAPI(title="ChronoLegal AI")
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
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    all_pdf_data = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds 50MB limit.")
        all_pdf_data.append((content, file.filename))

    events = extract_chronology_from_pdfs(all_pdf_data)

    if not events:
        raise HTTPException(
            status_code=422,
            detail="No medical events could be extracted. Ensure the PDFs contain readable text (not scanned images).",
        )

    label = case_name.strip() if case_name.strip() else (all_pdf_data[0][1].replace(".pdf", "") if len(all_pdf_data) == 1 else "medical_records")
    safe_label = label.replace(" ", "_").replace("/", "-")

    if output_format == "word":
        buffer = generate_word(events, label)
        filename = f"chronology_{safe_label}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        buffer = generate_excel(events, label)
        filename = f"chronology_{safe_label}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
