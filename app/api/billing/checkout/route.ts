import { NextRequest, NextResponse } from 'next/server';
import { getPriceForCaseCount, PRICING_TIERS } from '@/lib/pricing';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export async function GET() {
  return NextResponse.json({ success: true, currency: 'ZAR', tiers: PRICING_TIERS });
}

export async function POST(req: NextRequest) {
  try {
    const { firmId, email, caseCount, tierName, callbackUrl } = await req.json();
    if (!firmId || !email) return NextResponse.json({ error: 'Missing firmId or email.' }, { status: 400 });

    const tier = tierName
      ? PRICING_TIERS.find(t => t.name === tierName)
      : null;

    if (tier && tier.isSubscription && tier.paystackPlanCode) {
      const payload: any = {
        email,
        plan: tier.paystackPlanCode,
        metadata: { firmId, tier: tier.name, type: 'subscription' },
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`,
      };
      console.log(`💳 [Paystack Subscription]: ${tier.name} for ${email}`);

      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Paystack init failed');

      return NextResponse.json({ success: true, redirectUrl: data.data.authorization_url, reference: data.data.reference, tier: tier.name, type: 'subscription' });
    }

    const caseCountNum = caseCount || 1;
    const pricing = getPriceForCaseCount(caseCountNum);
    const payload: any = {
      email,
      amount: pricing.totalCents,
      currency: 'ZAR',
      metadata: { firmId, allocatedTokens: String(caseCountNum), tier: pricing.name, type: 'one_time' },
      callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`,
    };
    console.log(`💳 [Paystack One-Time]: ${caseCountNum} cases, R${pricing.totalPriceZAR}`);

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.status) throw new Error(data.message || 'Paystack init failed');

    return NextResponse.json({ success: true, redirectUrl: data.data.authorization_url, reference: data.data.reference, tier: pricing.name, caseCount: caseCountNum, totalZAR: pricing.totalPriceZAR, type: 'one_time' });

  } catch (error: any) {
    console.error('❌ [Paystack Error]:', error);
    return NextResponse.json({ error: 'Payment gateway error.', detail: error.message }, { status: 500 });
  }
}