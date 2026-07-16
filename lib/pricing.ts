/**
 * ChronoLegal SA — Pricing Configuration
 * Central pricing source of truth. All prices in ZAR.
 * Paystack plan codes for subscription tiers.
 */
export interface PricingTier {
  name: string;
  casesPerBundle: number;
  totalPriceZAR: number;
  effectivePricePerCase: number;
  isSubscription: boolean;
  paystackPlanCode?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  { name: 'Single Case', casesPerBundle: 1, totalPriceZAR: 1950, effectivePricePerCase: 1950, isSubscription: false, paystackPlanCode: 'PLN_w10j04yhz69ty96' },
  { name: 'Professional', casesPerBundle: 5, totalPriceZAR: 7500, effectivePricePerCase: 1500, isSubscription: true, paystackPlanCode: 'PLN_nrcvdfxmwi02te9' },
  { name: 'Practice', casesPerBundle: 10, totalPriceZAR: 12500, effectivePricePerCase: 1250, isSubscription: true, paystackPlanCode: 'PLN_gwhydihsdtevhdc' },
  { name: 'Chambers', casesPerBundle: 30, totalPriceZAR: 18500, effectivePricePerCase: 617, isSubscription: true },
];

export const LAUNCH = { SINGLE: 1450, PROFESSIONAL: 5950, LOCK_MONTHS: 24 };
export const TRIAL_DAYS = 14;

export function getTierByPlanCode(code: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.paystackPlanCode === code);
}

export function getPriceForCaseCount(caseCount: number) {
  const extraCases = caseCount > 30 ? caseCount - 30 : 0;
  if (caseCount <= 1)  return { ...PRICING_TIERS[0], totalCents: PRICING_TIERS[0].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 5)  return { ...PRICING_TIERS[1], totalCents: PRICING_TIERS[1].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 10) return { ...PRICING_TIERS[2], totalCents: PRICING_TIERS[2].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 30) return { ...PRICING_TIERS[3], totalCents: PRICING_TIERS[3].totalPriceZAR * 100, extraCases: 0 };
  const totalZAR = PRICING_TIERS[3].totalPriceZAR + extraCases * 1650;
  return { ...PRICING_TIERS[3], totalPriceZAR: totalZAR, totalCents: totalZAR * 100, extraCases };
}