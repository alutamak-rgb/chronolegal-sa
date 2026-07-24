import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTierByPlanCode, TRIAL_DAYS } from '@/lib/pricing';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';

function verifyPaystack(body: string, sig: string): boolean {
  if (!PAYSTACK_SECRET) return true;
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
  return hash === sig;
}

async function pbAuth() {
  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error('PocketBase admin credentials not configured');
  }
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
  });
  const data = await res.json();
  return data.token;
}

async function updateUser(firmId: string, updates: Record<string, any>, token: string) {
  await fetch(`${PB_URL}/api/collections/users/records/${firmId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
}

async function getUser(firmId: string, token: string) {
  const res = await fetch(`${PB_URL}/api/collections/users/records/${firmId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    if (!verifyPaystack(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`📨 [Paystack Webhook]: ${event.event}`);

    const adminToken = await pbAuth();

    if (event.event === 'charge.success') {
      const metadata = event.data.metadata || {};
      const firmId = metadata.firmId;
      const type = metadata.type;

      if (!firmId) return NextResponse.json({ received: true });

      if (type === 'subscription') {
        const planCode = event.data.plan?.plan_code || metadata.plan;
        const tier = getTierByPlanCode(planCode);
        const tokens = tier?.casesPerBundle || 5;
        const customerCode = event.data.customer?.customer_code || '';
        const subCode = event.data.subscription?.subscription_code || '';

        console.log(`🎉 [Subscription]: ${tier?.name || planCode} → ${firmId}, +${tokens} tokens`);
        await updateUser(firmId, {
          tokens,
          subscriptionPlan: planCode,
          subscriptionStatus: 'active',
          trialEndsAt: null,
          paystackCustomerCode: customerCode,
          paystackSubscriptionCode: subCode,
        }, adminToken);
      } else {
        const allocatedTokens = parseInt(metadata.allocatedTokens || '0', 10);
        const user = await getUser(firmId, adminToken);
        const currentTokens = user.tokens || 0;

        console.log(`🎉 [One-Time]: +${allocatedTokens} tokens → ${firmId}`);
        await updateUser(firmId, {
          tokens: currentTokens + allocatedTokens,
          paystackCustomerCode: event.data.customer?.customer_code || user.paystackCustomerCode || '',
        }, adminToken);
      }
    }

    if (event.event === 'subscription.disable') {
      const customerCode = event.data.customer?.customer_code;
      console.log(`⚠️ [Subscription Disabled]: customer ${customerCode}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ [Paystack Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}