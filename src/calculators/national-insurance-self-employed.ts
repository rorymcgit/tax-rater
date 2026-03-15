import { Breakdown } from '../types/tax';

/*
  Self-Employed NICs (2025/2026)

  Class 2: flat £3.45/week (£179.40/year) if annual profits > £12,570
  Class 4:
    6% on profits £12,570–£50,270
    2% above £50,270

  https://www.gov.uk/self-employed-national-insurance-rates
*/

const CLASS_2_WEEKLY_RATE = 3.45;
const CLASS_2_ANNUAL = CLASS_2_WEEKLY_RATE * 52; // £179.40
const CLASS_2_THRESHOLD = 12_570;

const CLASS_4_BANDS = {
  lower: {
    lower: 0,
    upper: 12_570,
    rate: 0,
  },
  mid: {
    lower: 12_570,
    upper: 50_270,
    rate: 0.06,
  },
  higher: {
    lower: 50_270,
    upper: Infinity,
    rate: 0.02,
  },
};

export interface SelfEmployedNI {
  class2: number;
  class4: number;
  total: number;
  breakdown: Breakdown[];
}

export function calculateSelfEmployedNI(annualProfit: number): SelfEmployedNI {
  const breakdown: Breakdown[] = [];

  // Class 2
  const class2 = annualProfit > CLASS_2_THRESHOLD ? CLASS_2_ANNUAL : 0;
  if (class2 > 0) {
    breakdown.push({
      band: 'Class 2 (flat rate)',
      taxable: annualProfit,
      tax: class2,
    });
  }

  // Class 4
  let class4 = 0;

  const { mid, higher } = CLASS_4_BANDS;

  const midRange = mid.upper - mid.lower;
  const midTaxable = Math.min(Math.max(0, annualProfit - mid.lower), midRange);
  const midTax = midTaxable * mid.rate;

  if (midTaxable > 0) {
    breakdown.push({
      band: 'Class 4 (6%)',
      taxable: midTaxable,
      tax: midTax,
    });
    class4 += midTax;
  }

  const higherTaxable = Math.max(0, annualProfit - higher.lower);
  const higherTax = higherTaxable * higher.rate;

  if (higherTaxable > 0) {
    breakdown.push({
      band: 'Class 4 (2%)',
      taxable: higherTaxable,
      tax: higherTax,
    });
    class4 += higherTax;
  }

  return {
    class2,
    class4,
    total: class2 + class4,
    breakdown,
  };
}
