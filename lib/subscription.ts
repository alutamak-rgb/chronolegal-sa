import { TRIAL_DAYS, PRICING_TIERS } from './pricing';

export interface SubscriptionState {
  plan: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'none';
  trialEndsAt: string | null;
  tokens: number;
  monthlyTokens: number;
}

export function canAccessTool(sub: SubscriptionState): boolean {
  if (sub.status === 'trial' && !isTrialExpired(sub.trialEndsAt)) return true;
  if (sub.status === 'active') return true;
  if (sub.tokens > 0) return true;
  return false;
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return true;
  return new Date(trialEndsAt) < new Date();
}

export function getTrialEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}

export function resetMonthlyTokens(sub: SubscriptionState): number {
  const tier = PRICING_TIERS.find(t => t.paystackPlanCode === sub.plan);
  return tier ? tier.casesPerBundle : 0;
}