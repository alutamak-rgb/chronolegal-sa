import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FIRMS_PATH = '/data/firms.json';

function readFirms(): any[] {
  try { return JSON.parse(fs.readFileSync(FIRMS_PATH, 'utf-8')); } catch { return []; }
}

function writeFirms(rows: any[]) {
  fs.writeFileSync(FIRMS_PATH, JSON.stringify(rows, null, 2));
}

function verifyYoco(body: string, sig: string, secret: string): boolean {
  if (!secret) return true; // mock mode
  return crypto.createHmac('sha256', secret).update(body).digest('hex') === sig;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('yoco-webhook-signature');
    const secret = process.env.YOCO_WEBHOOK_SECRET || '';

    if (!signature || !verifyYoco(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.paid') {
      const metadata = event.data.metadata;
      const firmId = metadata.firmId;
      const tokens = parseInt(metadata.allocatedTokens, 10);

      console.log(`🎉 [Payment]: ${tokens} tokens → ${firmId}`);

      // Initialize firms file if needed
      if (!fs.existsSync(FIRMS_PATH)) fs.writeFileSync(FIRMS_PATH, '[]');

      const firms = readFirms();
      const idx = firms.findIndex((f: any) => f.id === firmId);

      if (idx === -1) {
        firms.push({ id: firmId, availableTokens: tokens, updatedAt: new Date().toISOString() });
      } else {
        firms[idx].availableTokens = (firms[idx].availableTokens || 0) + tokens;
        firms[idx].updatedAt = new Date().toISOString();
      }

      writeFirms(firms);
      return NextResponse.json({ success: true, tokens: tokens });
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ [Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
