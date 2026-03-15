import { Tax, Breakdown } from "../types/tax";

/*
  Dividend tax — 2025/2026 (UK-wide, not devolved)

  Dividend allowance: £500 tax-free
  Basic rate:     8.75%  on dividends within the basic rate band (£12,570–£50,270)
  Higher rate:    33.75% on dividends within the higher rate band (£50,270–£125,140)
  Additional rate: 39.35% on dividends above £125,140

  Dividends sit on top of salary — salary uses up the bands first.

  https://www.gov.uk/tax-on-dividends
*/

const DIVIDEND_ALLOWANCE = 500;
const BASIC_LOWER = 12_570;
const BASIC_UPPER = 50_270;
const HIGHER_UPPER = 125_140;

export function calculateDividendTax(
  dividendIncome: number,
  salaryIncome: number,
): Tax {
  if (dividendIncome <= 0) {
    return { tax: 0, breakdown: [] };
  }

  const breakdown: Breakdown[] = [];
  let tax = 0;
  let remaining = dividendIncome;

  // Apply £500 allowance first
  const allowanceUsed = Math.min(remaining, DIVIDEND_ALLOWANCE);
  remaining -= allowanceUsed;
  if (allowanceUsed > 0) {
    breakdown.push({ band: "Dividend Allowance (0%)", taxable: allowanceUsed, tax: 0 });
  }

  if (remaining <= 0) {
    return { tax: 0, breakdown };
  }

  // Basic rate band: salary fills from BASIC_LOWER upwards; remaining space is available for dividends
  const salaryInBasic = Math.max(0, Math.min(salaryIncome, BASIC_UPPER) - BASIC_LOWER);
  const basicBandSpace = Math.max(0, BASIC_UPPER - BASIC_LOWER - salaryInBasic);
  const basicTaxable = Math.min(remaining, basicBandSpace);
  if (basicTaxable > 0) {
    const bandTax = basicTaxable * 0.0875;
    breakdown.push({ band: "Basic Rate (8.75%)", taxable: basicTaxable, tax: bandTax });
    tax += bandTax;
    remaining -= basicTaxable;
  }

  if (remaining <= 0) {
    return { tax, breakdown };
  }

  // Higher rate band
  const salaryInHigher = Math.max(0, Math.min(salaryIncome, HIGHER_UPPER) - BASIC_UPPER);
  const higherBandSpace = Math.max(0, HIGHER_UPPER - BASIC_UPPER - salaryInHigher);
  const higherTaxable = Math.min(remaining, higherBandSpace);
  if (higherTaxable > 0) {
    const bandTax = higherTaxable * 0.3375;
    breakdown.push({ band: "Higher Rate (33.75%)", taxable: higherTaxable, tax: bandTax });
    tax += bandTax;
    remaining -= higherTaxable;
  }

  if (remaining <= 0) {
    return { tax, breakdown };
  }

  // Additional rate
  const additionalTax = remaining * 0.3935;
  breakdown.push({ band: "Additional Rate (39.35%)", taxable: remaining, tax: additionalTax });
  tax += additionalTax;

  return { tax, breakdown };
}
