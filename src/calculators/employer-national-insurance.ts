import { Tax, Breakdown } from "../types/tax";

/*
  Employer NICs (Class 1) — 6 April 2025 to 5 April 2026
  Rate: 15% above the relevant threshold (varies by category letter)

  Thresholds (weekly → annual):
    Standard (A/B/C/J):           £96/week  = £4,992/year  (Secondary Threshold)
    Upper secondary (D/E/F/I/K/L/N/S): £481/week = £25,012/year (Upper Secondary Threshold)
    Apprentice/under-21 (H/M/V/Z): £967/week = £50,284/year (Upper Earnings Limit)

  https://www.gov.uk/national-insurance-rates-letters
*/

const RATE = 0.15;

// Annual thresholds derived from weekly figures × 52
const SECONDARY_THRESHOLD = 96 * 52;        // £4,992
const UPPER_SECONDARY_THRESHOLD = 481 * 52; // £25,012
const UPPER_EARNINGS_LIMIT = 967 * 52;      // £50,284

// Category letters grouped by which threshold applies
const STANDARD_CATEGORIES    = new Set(["A", "B", "C", "J"]);
const UPPER_SEC_CATEGORIES   = new Set(["D", "E", "F", "I", "K", "L", "N", "S"]);
const UPPER_EARN_CATEGORIES  = new Set(["H", "M", "V", "Z"]);

export type EmployerNICCategory = "A" | "B" | "C" | "D" | "E" | "F" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "S" | "V" | "Z";

function thresholdForCategory(category: EmployerNICCategory): number {
  if (STANDARD_CATEGORIES.has(category))   return SECONDARY_THRESHOLD;
  if (UPPER_SEC_CATEGORIES.has(category))  return UPPER_SECONDARY_THRESHOLD;
  if (UPPER_EARN_CATEGORIES.has(category)) return UPPER_EARNINGS_LIMIT;
  return SECONDARY_THRESHOLD;
}

export function calculateEmployerNationalInsurance(
  income: number,
  category: EmployerNICCategory = "A",
): Tax {
  const threshold = thresholdForCategory(category);
  const taxable = Math.max(0, income - threshold);

  if (taxable === 0) {
    return { tax: 0, breakdown: [] };
  }

  const tax = taxable * RATE;
  const breakdown: Breakdown[] = [
    { band: `Category ${category} — above threshold`, taxable, tax },
  ];

  return { tax, breakdown };
}
