import { Breakdown, Tax } from "../types/tax";

/*
  Employer NICs (Class 1, Secondary Contributions)
  These are costs borne by the employer, NOT deducted from employee pay.

  https://www.gov.uk/national-insurance-rates-letters

  2025/2026 rates:
    0%      £0 to £9,100  (Secondary Threshold)
    13.8%   £9,100+
*/

// Employer NIC secondary threshold (2025/2026 FY)
const SECONDARY_THRESHOLD = 9100;
const EMPLOYER_RATE = 0.138;

export function calculateEmployerNationalInsurance(income: number): Tax {
  let tax = 0;
  const breakdown: Breakdown[] = [];

  const taxable = Math.max(0, income - SECONDARY_THRESHOLD);

  if (taxable === 0) {
    return { tax, breakdown };
  }

  tax = taxable * EMPLOYER_RATE;
  breakdown.push({
    band: "Above Secondary Threshold",
    taxable,
    tax,
  });

  return { tax, breakdown };
}
