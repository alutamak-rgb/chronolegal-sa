/**
 * ChronoLegal SA — Pricing Configuration
 * Central pricing source of truth. All prices in ZAR.
 */
export const PRICING_TIERS = [
  { name: 'Single Case', casesPerBundle: 1, totalPriceZAR: 1950, effectivePricePerCase: 1950, isSubscription: false },
  { name: 'Professional', casesPerBundle: 5, totalPriceZAR: 7500, effectivePricePerCase: 1500, isSubscription: true },
  { name: 'Practice', casesPerBundle: 10, totalPriceZAR: 12500, effectivePricePerCase: 1250, isSubscription: true },
  { name: 'Chambers', casesPerBundle: 30, totalPriceZAR: 18500, effectivePricePerCase: 617, isSubscription: true },
];

export const LAUNCH = { SINGLE: 1450, PROFESSIONAL: 5950, LOCK_MONTHS: 24 };

export function getPriceForCaseCount(caseCount: number) {
  const extraCases = caseCount > 30 ? caseCount - 30 : 0;
  
  if (caseCount <= 1)  return { ...PRICING_TIERS[0], totalCents: PRICING_TIERS[0].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 5)  return { ...PRICING_TIERS[1], totalCents: PRICING_TIERS[1].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 10) return { ...PRICING_TIERS[2], totalCents: PRICING_TIERS[2].totalPriceZAR * 100, extraCases: 0 };
  if (caseCount <= 30) return { ...PRICING_TIERS[3], totalCents: PRICING_TIERS[3].totalPriceZAR * 100, extraCases: 0 };
  
  // Beyond 30: Chambers + extra cases at R1,650
  const totalZAR = PRICING_TIERS[3].totalPriceZAR + extraCases * 1650;
  return { ...PRICING_TIERS[3], totalPriceZAR: totalZAR, totalCents: totalZAR * 100, extraCases };
}
