import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { firmId, caseCount, callbackUrl } = await req.json();
    if (!firmId || !caseCount) return NextResponse.json({ error: 'Missing firmId or caseCount.' }, { status: 400 });

    // Tiered SA pricing: R250/case (10+) or R350/case (1-9)
    const pricePerCase = caseCount >= 10 ? 250 : 350;
    const totalCents = caseCount * pricePerCase * 100;

    console.log(`💳 [Billing]: R${totalCents / 100} for ${caseCount} cases — Firm: ${firmId}`);

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });

    const response = await fetch('https://online.yoco.com/v1/checkouts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalCents,
        currency: 'ZAR',
        description: `ChronoLegal SA — ${caseCount} analysis tokens`,
        metadata: { firmId, allocatedTokens: String(caseCount) },
        successUrl: `${callbackUrl}?status=success&tokens=${caseCount}`,
        cancelUrl: `${callbackUrl}?status=cancelled`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Yoco rejected: ${err}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, checkoutId: data.id, redirectUrl: data.redirectUrl });

  } catch (error: any) {
    console.error('❌ [Billing Error]:', error);
    return NextResponse.json({ error: 'Payment gateway error.', detail: error.message }, { status: 500 });
  }
}
