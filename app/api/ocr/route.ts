import { NextRequest, NextResponse } from 'next/server';
import { performHeavyOCR } from '@/lib/ocr';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No document file provided.' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/pdf';

    console.log(`📥 [OCR Route]: Processing "${file.name}" (${file.size} bytes) — ${mimeType}`);

    const ocrResult = await performHeavyOCR(buffer, mimeType);

    return NextResponse.json({ success: true, filename: file.name, ...ocrResult });

  } catch (error: any) {
    console.error('❌ [OCR Route Error]:', error);
    return NextResponse.json({ error: error.message || 'OCR processing failed.' }, { status: 500 });
  }
}
