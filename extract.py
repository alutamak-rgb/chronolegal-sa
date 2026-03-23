import os
import io
import json
import fitz  # PyMuPDF
import anthropic
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

CHUNK_SIZE = 25

EXTRACTION_PROMPT = """You are a specialist in legal medical chronology creation for personal injury litigation.

Extract every medically significant event from the records below. For each event return:
- "date": ISO format (YYYY-MM-DD). If only month/year known use first of month. If unknown use "Unknown".
- "event_type": one of Visit, Diagnosis, Treatment, Procedure, Test, Imaging, Surgery, Prescription, Referral, Discharge, Other
- "provider": doctor name and/or facility (e.g. "Dr. John Smith, City General Hospital")
- "description": 1-2 sentences — what happened, what was found, what was prescribed
- "significance": Critical | High | Medium | Low  (Critical = directly relates to injury mechanism or permanent impairment)
- "page_ref": page number(s) where this event appears

Focus on events relevant to personal injury: onset of injury, diagnoses, treatments, test results, referrals, functional limitations, prognosis statements.

Return ONLY a valid JSON array. No explanation, no markdown fences.

Medical records:
"""


def extract_chronology_from_pdfs(pdf_list: list[tuple[bytes, str]]) -> list[dict]:
    """Accept multiple (bytes, filename) tuples, extract and merge events."""
    all_events = []

    for pdf_bytes, filename in pdf_list:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)

        for start in range(0, total_pages, CHUNK_SIZE):
            end = min(start + CHUNK_SIZE, total_pages)
            chunk_text = ""
            for page_num in range(start, end):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    chunk_text += f"\n\n--- PAGE {page_num + 1} ({filename}) ---\n{text}"

            if not chunk_text.strip():
                continue

            events = _call_claude(chunk_text)
            all_events.extend(events)

        doc.close()

    # Sort: dated events chronologically, unknowns at end
    def sort_key(e):
        d = e.get("date", "Unknown")
        if d == "Unknown":
            return (1, datetime.max)
        try:
            return (0, datetime.strptime(d, "%Y-%m-%d"))
        except ValueError:
            return (1, datetime.max)

    all_events.sort(key=sort_key)
    return all_events


def _call_claude(text: str) -> list[dict]:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": EXTRACTION_PROMPT + text}],
    )

    raw = message.content[0].text.strip()

    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    try:
        events = json.loads(raw)
        return events if isinstance(events, list) else []
    except json.JSONDecodeError:
        return []


# ── EXCEL ────────────────────────────────────────────────────────────────────

def generate_excel(events: list[dict], case_name: str) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Chronology"

    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    thin = Side(style="thin", color="CCCCCC")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    sig_colors = {"Critical": "C00000", "High": "E36C09", "Medium": "F2C500", "Low": "A6A6A6"}
    sig_font_colors = {"Critical": "FFFFFF", "High": "FFFFFF", "Medium": "000000", "Low": "FFFFFF"}

    headers = ["#", "Date", "Event Type", "Provider", "Description", "Significance", "Page"]
    col_widths = [5, 14, 16, 28, 65, 14, 8]

    for col, (header, width) in enumerate(zip(headers, col_widths), 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
        ws.column_dimensions[cell.column_letter].width = width

    ws.row_dimensions[1].height = 20

    for idx, event in enumerate(events, 1):
        row = idx + 1
        sig = event.get("significance", "Medium")

        ws.cell(row=row, column=1, value=idx).alignment = Alignment(horizontal="center", vertical="center")
        ws.cell(row=row, column=2, value=event.get("date", "Unknown")).alignment = Alignment(horizontal="center", vertical="top")
        ws.cell(row=row, column=3, value=event.get("event_type", "")).alignment = Alignment(horizontal="left", vertical="top")
        ws.cell(row=row, column=4, value=event.get("provider", "")).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        ws.cell(row=row, column=5, value=event.get("description", "")).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

        sig_cell = ws.cell(row=row, column=6, value=sig)
        sig_cell.fill = PatternFill(start_color=sig_colors.get(sig, "A6A6A6"), end_color=sig_colors.get(sig, "A6A6A6"), fill_type="solid")
        sig_cell.font = Font(color=sig_font_colors.get(sig, "FFFFFF"), bold=True, size=10)
        sig_cell.alignment = Alignment(horizontal="center", vertical="center")

        ws.cell(row=row, column=7, value=event.get("page_ref", "")).alignment = Alignment(horizontal="center", vertical="top")

        for col in range(1, 8):
            ws.cell(row=row, column=col).border = border

        ws.row_dimensions[row].height = 40

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:G{len(events) + 1}"

    # Summary sheet
    sw = wb.create_sheet("Summary")
    sw.column_dimensions["A"].width = 25
    sw.column_dimensions["B"].width = 40

    sw["A1"] = "ChronoLegal AI — Medical Chronology Report"
    sw["A1"].font = Font(bold=True, size=14, color="1F4E79")
    sw.row_dimensions[1].height = 25

    meta = [
        ("Case / Matter", case_name),
        ("Generated", datetime.now().strftime("%Y-%m-%d %H:%M")),
        ("Total Events", len(events)),
        ("Critical Events", sum(1 for e in events if e.get("significance") == "Critical")),
        ("High Priority Events", sum(1 for e in events if e.get("significance") == "High")),
        ("Date Range", f"{events[0].get('date', 'Unknown')} → {events[-1].get('date', 'Unknown')}" if events else "N/A"),
    ]

    for row_num, (label, value) in enumerate(meta, 3):
        sw.cell(row=row_num, column=1, value=label).font = Font(bold=True)
        sw.cell(row=row_num, column=2, value=value)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


# ── WORD ─────────────────────────────────────────────────────────────────────

def _set_cell_bg(cell, hex_color: str):
    """Set Word table cell background colour."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def generate_word(events: list[dict], case_name: str) -> io.BytesIO:
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("MEDICAL CHRONOLOGY REPORT")
    run.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.add_run(f"Case: {case_name}   |   Generated: {datetime.now().strftime('%Y-%m-%d')}   |   Total Events: {len(events)}")

    doc.add_paragraph()

    # Table
    headers = ["#", "Date", "Type", "Provider", "Description", "Significance", "Page"]
    col_widths_in = [0.3, 0.9, 0.9, 1.6, 3.4, 1.0, 0.5]

    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"

    # Header row
    hdr_row = table.rows[0]
    for i, (h, w) in enumerate(zip(headers, col_widths_in)):
        cell = hdr_row.cells[i]
        cell.width = Inches(w)
        _set_cell_bg(cell, "1F4E79")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(9)

    sig_colors = {"Critical": "C00000", "High": "E36C09", "Medium": "F2C500", "Low": "A6A6A6"}

    for idx, event in enumerate(events, 1):
        sig = event.get("significance", "Medium")
        row = table.add_row()

        values = [
            str(idx),
            event.get("date", "Unknown"),
            event.get("event_type", ""),
            event.get("provider", ""),
            event.get("description", ""),
            sig,
            str(event.get("page_ref", "")),
        ]

        for i, (val, w) in enumerate(zip(values, col_widths_in)):
            cell = row.cells[i]
            cell.width = Inches(w)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 4 else WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(val)
            run.font.size = Pt(8)

            if i == 5:  # Significance column
                _set_cell_bg(cell, sig_colors.get(sig, "A6A6A6"))
                run.bold = True
                if sig in ("Critical", "High", "Low"):
                    run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
