import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const metadata = payload.metadata || { caseNumber: "2024/29841", division: "GAUTENG DIVISION, JOHANNESBURG", plaintiff: "MOCK PLAINTIFF", defendant: "ROAD ACCIDENT FUND" };
    const items = payload.documents || [
      { id: "1", sectionCode: "A", documentName: "Summons and Particulars of Claim", startPage: 1, endPage: 15 },
      { id: "2", sectionCode: "A", documentName: "Defendant's Plea (RAF)", startPage: 16, endPage: 22 },
      { id: "3", sectionCode: "B", documentName: "Orthopaedic Medico-Legal Report (Dr. Naidoo)", startPage: 1, endPage: 34 },
      { id: "4", sectionCode: "B", documentName: "Occupational Therapist Report (S. Cele)", startPage: 35, endPage: 58 },
      { id: "5", sectionCode: "C", documentName: "State Hospital Trauma File", startPage: 1, endPage: 124 },
    ];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "IN THE HIGH COURT OF SOUTH AFRICA", bold: true, size: 24, font: "Arial" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `(${metadata.division.toUpperCase()})`, bold: true, size: 20, font: "Arial" })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 300 }, children: [new TextRun({ text: "CASE NO: ", bold: true, size: 22 }), new TextRun({ text: metadata.caseNumber, bold: true, size: 22 })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "In the matter between:\n", size: 18, italic: true })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: metadata.plaintiff.toUpperCase(), bold: true, size: 22 }), new TextRun({ text: "  (Plaintiff)", italic: true, size: 18 })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "and\n", size: 18, italic: true })] }),
          new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: metadata.defendant.toUpperCase(), bold: true, size: 22 }), new TextRun({ text: "  (Defendant)", italic: true, size: 18 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "_____________________________________________________________" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "PLAINTIFF'S INDEX & PAGINATION SCHEDULE", bold: true, size: 26 })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Prepared in compliance with DJP Practice Directives for electronic bundles. Document entries structured with CaseLines prefix-pagination — no leading chronological date signatures.", italic: true, size: 16 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: [
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 12 }, bottom: { style: BorderStyle.DOUBLE, size: 12 } }, children: [new Paragraph({ children: [new TextRun({ text: "SEC.", bold: true, size: 20 })] })] }),
                new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 12 }, bottom: { style: BorderStyle.DOUBLE, size: 12 } }, children: [new Paragraph({ children: [new TextRun({ text: "DOCUMENT DESCRIPTION", bold: true, size: 20 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 12 }, bottom: { style: BorderStyle.DOUBLE, size: 12 } }, children: [new Paragraph({ children: [new TextRun({ text: "PAGINATION", bold: true, size: 20 })] })] }),
              ]}),
              ...items.map((item: any) => new TableRow({ children: [
                new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } }, children: [new Paragraph({ children: [new TextRun({ text: item.sectionCode, size: 18 })] })] }),
                new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } }, children: [new Paragraph({ children: [new TextRun({ text: item.documentName, size: 18 })] })] }),
                new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } }, children: [new Paragraph({ children: [new TextRun({ text: `${item.sectionCode}${item.startPage} - ${item.sectionCode}${item.endPage}`, size: 18 })] })] }),
              ]})),
            ],
          }),
          new Paragraph({ spacing: { before: 800 }, children: [new TextRun({ text: "DATED AT ", bold: true, size: 18 }), new TextRun({ text: "____________________", size: 18 }), new TextRun({ text: " ON THIS ", bold: true, size: 18 }), new TextRun({ text: "_____", size: 18 }), new TextRun({ text: " DAY OF ", bold: true, size: 18 }), new TextRun({ text: "__________________ 2026.", size: 18 })] }),
          new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "____________________________________\n", bold: true }), new TextRun({ text: "PLAINTIFF'S ATTORNEYS\n", bold: true, size: 18 }), new TextRun({ text: "ECHOAI STUDIO\n", size: 18 }), new TextRun({ text: "Pretoria, South Africa\n", size: 16 }), new TextRun({ text: "Email: litigation@echoaistudio.xyz", size: 16, italic: true })] }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="CaseLines_Index_${metadata.caseNumber.replace(/\//g, '_')}.docx"`,
      },
    });

  } catch (error: any) {
    console.error("❌ [Index Export Error]:", error);
    return NextResponse.json({ error: error.message || 'Failed to compile index.' }, { status: 500 });
  }
}
