import { Breakdown, Tax } from '../types/tax';

/*
  NOTE: This is EMPLOYEE NICs (Class 1) only

  TODO: Add other categories (+ checkboxes/dropdowns in UI to help categorise user)
  TODO: Add self-employed rates
  TODO: Add employer side too

  https://www.gov.uk/national-insurance-rates-letters
  https://www.gov.uk/national-insurance-rates-letters/category-letters


  Class 1 [Category A]
    rate    weekly threshold    monthly threshold
    0%      £125 to £242        £542 to £1,048
    8%      £242.01 to £967     £1,048.01 to £4,189
    2%      £967+               £4,189+
  */

// UK national insurance bands (2026/2027 FY)
// FYI this is for Category A only - which _most_ people fit into
const EMPLOYEE_BANDS = {
  bottom: {
    lower: 0,
    upper: 12570,
    rate: 0,
  },
  mid: {
    lower: 12570,
    upper: 50270,
    rate: 0.08,
  },
  higher: {
    lower: 50270,
    upper: Infinity,
    rate: 0.02,
  },
};

export function calculateNationalInsurance(income: number): Tax {
  let tax = 0;
  const breakdown: Breakdown[] = [];

  // Subtract the tax-free rate
  const taxable = Math.max(0, income - EMPLOYEE_BANDS.bottom.upper);

  // Early exit if nothing to tax
  if (taxable === 0) {
    return {
      tax,
      breakdown,
    };
  }

  const { mid } = EMPLOYEE_BANDS;
  const midRange = mid.upper - mid.lower;
  const midTaxable = Math.min(taxable, midRange);
  const midTax = midTaxable * mid.rate;
  const midBreakdown = {
    band: 'Middle',
    taxable: midTaxable,
    tax: midTax,
  };
  breakdown.push(midBreakdown);
  tax += midTax;

  const { higher } = EMPLOYEE_BANDS;
  const higherTaxable = Math.max(0, income - EMPLOYEE_BANDS.higher.lower);
  if (higherTaxable === 0) {
    return {
      tax,
      breakdown,
    };
  }

  const higherTax = higherTaxable * higher.rate;
  const higherBreakdown = {
    band: 'Higher',
    taxable: higherTaxable,
    tax: higherTax,
  };
  breakdown.push(higherBreakdown);
  tax += higherTax;

  return {
    tax,
    breakdown,
  };
}
