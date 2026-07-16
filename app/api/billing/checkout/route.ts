import { NextRequest, NextResponse } from 'next/server';
import { getPriceForCaseCount, PRICING_TIERS } from '@/lib/pricing';

/** GET — returns pricing tiers for display */
export async function GET() {
  return NextResponse.json({ success: true, currency: 'ZAR', tiers: PRICING_TIERS });
}

/** POST — create Yoco checkout session */
export async function POST(req: NextRequest) {
  try {
    const { firmId, caseCount, callbackUrl } = await req.json();
    if (!firmId || !caseCount) return NextResponse.json({ error: 'Missing firmId or caseCount.' }, { status: 400 });

    const pricing = getPriceForCaseCount(caseCount);
    const tier = pricing.name;
    const hasExtras = pricing.extraCases > 0;

    console.log(`💳 [Billing]: Firm ${firmId} — ${caseCount} cases → ${tier} tier — R${pricing.totalPriceZAR}`);

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });

    const description = hasExtras
      ? `ChronoLegal AI — ${tier} (30 cases) + ${pricing.extraCases} extra. ${caseCount} tokens.`
      : `ChronoLegal AI — ${tier}: ${caseCount} tokens. R${pricing.effectivePricePerCase}/case.`;

    const response = await fetch('https://online.yoco.com/v1/checkouts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: pricing.totalCents,
        currency: 'ZAR',
        description,
        metadata: { firmId, allocatedTokens: String(caseCount), tier },
        successUrl: `${callbackUrl}?status=success&tokens=${caseCount}`,
        cancelUrl: `${callbackUrl}?status=cancelled`,
      }),
    });

    if (!response.ok) throw new Error(`Yoco rejected: ${await response.text()}`);

    const data = await response.json();
    return NextResponse.json({ success: true, checkoutId: data.id, redirectUrl: data.redirectUrl, pricing: { tier, caseCount, totalZAR: pricing.totalPriceZAR } });

  } catch (error: any) {
    console.error('❌ [Billing Error]:', error);
    return NextResponse.json({ error: 'Payment gateway error.', detail: error.message }, { status: 500 });
  }
}
