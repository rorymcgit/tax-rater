import { Tax, Breakdown } from "../types/tax";

/*
  Employer NICs (Class 1) — 2025/2026
  13.8% on earnings above the secondary threshold of £9,100/year

  https://www.gov.uk/national-insurance-rates-letters
*/

const SECONDARY_THRESHOLD = 9_100;
const EMPLOYER_RATE = 0.138;

export function calculateEmployerNationalInsurance(income: number): Tax {
  const taxable = Math.max(0, income - SECONDARY_THRESHOLD);

  if (taxable === 0) {
    return { tax: 0, breakdown: [] };
  }

  const tax = taxable * EMPLOYER_RATE;
  const breakdown: Breakdown[] = [
    { band: "Above secondary threshold", taxable, tax },
  ];

  return { tax, breakdown };
}
