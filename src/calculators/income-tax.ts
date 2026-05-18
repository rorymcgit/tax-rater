import { Breakdown, Tax } from '../types/tax';

/*
  https://www.gov.uk/income-tax-rates
  https://www.gov.uk/scottish-income-tax
*/

export type Region = 'england' | 'scotland';

interface TaxBand {
  name: string;
  lower: number; // taxable income lower bound
  upper: number; // taxable income upper bound
  rate: number;
}

const PERSONAL_ALLOWANCE = 12_570;

// The gross income threshold at which the top rate begins (England: Additional Rate,
// Scotland: Top Rate). This is also the income at which the personal allowance reaches 0.
const TOP_RATE_GROSS_THRESHOLD = 125_140;

// England / Wales / NI bands (2026/2027 FY) — expressed as taxable income thresholds.
// The higher rate upper bound is dynamic: (TOP_RATE_GROSS_THRESHOLD - personalAllowance).
function getEnglandBands(topRateThreshold: number): TaxBand[] {
  return [
    { name: 'Basic Rate', lower: 0, upper: 37_700, rate: 0.2 },
    { name: 'Higher Rate', lower: 37_700, upper: topRateThreshold, rate: 0.4 },
    {
      name: 'Additional Rate',
      lower: topRateThreshold,
      upper: Infinity,
      rate: 0.45,
    },
  ];
}

// Scotland bands (2026/2027 FY) — expressed as taxable income thresholds.
// Gross income thresholds: 16537, 29526, 43662, 75000, 125140.
// Taxable income thresholds derived by subtracting full PA (12570) from each gross threshold.
function getScotlandBands(topRateThreshold: number): TaxBand[] {
  return [
    { name: 'Starter Rate', lower: 0, upper: 3_967, rate: 0.19 },
    { name: 'Scottish Basic Rate', lower: 3_967, upper: 16_956, rate: 0.2 },
    { name: 'Intermediate Rate', lower: 16_956, upper: 31_092, rate: 0.21 },
    { name: 'Higher Rate', lower: 31_092, upper: 62_430, rate: 0.42 },
    {
      name: 'Advanced Rate',
      lower: 62_430,
      upper: topRateThreshold,
      rate: 0.45,
    },
    { name: 'Top Rate', lower: topRateThreshold, upper: Infinity, rate: 0.48 },
  ];
}

export function calculateIncomeTax(
  grossIncome: number,
  region: Region = 'england',
): Tax {
  let personalAllowance = PERSONAL_ALLOWANCE;
  if (grossIncome > 100_000) {
    const reduction = Math.floor((grossIncome - 100_000) / 2);
    personalAllowance = Math.max(0, PERSONAL_ALLOWANCE - reduction);
  }

  const taxableIncome = Math.max(0, grossIncome - personalAllowance);
  const breakdown: Breakdown[] = [];
  let tax = 0;

  const paUsed = Math.min(grossIncome, personalAllowance);
  if (paUsed > 0) {
    breakdown.push({ band: 'Personal Allowance', taxable: paUsed, tax: 0 });
  }

  // The boundary between the second-highest and top rate band shifts with personal allowance,
  // because it is always at gross £125,140 regardless of how much PA has been tapered.
  const topRateThreshold = TOP_RATE_GROSS_THRESHOLD - personalAllowance;
  const bands =
    region === 'scotland'
      ? getScotlandBands(topRateThreshold)
      : getEnglandBands(topRateThreshold);

  for (const band of bands) {
    if (taxableIncome <= band.lower) break;
    const taxable = Math.min(taxableIncome, band.upper) - band.lower;
    const bandTax = taxable * band.rate;
    breakdown.push({ band: band.name, taxable, tax: bandTax });
    tax += bandTax;
  }

  return { tax, breakdown };
}
