import { Breakdown, Tax } from '../types/tax';

/*
  https://www.gov.uk/income-tax-rates
 */

// UK tax bands (2025/2026 FY)
const BANDS = {
  personalAllowance: {
    lower: 0,
    upper: 12570,
    rate: 0
  },
  basicRate: {
    lower: 12570,
    upper: 50270,
    rate: 0.20
  },
  higherRate: {
    lower: 50270,
    upper: 125140,
    rate: 0.40
  },
  additionalRate: {
    lower: 125140,
    upper: Infinity,
    rate: 0.45
  }
};

export function calculateIncomeTax(grossIncome: number): Tax {
  const breakdown: Breakdown[] = [];
  let tax = 0;

  const fullAllowance = BANDS.personalAllowance.upper;
  let personalAllowance = fullAllowance;
  if (grossIncome > 100_000) {
    const reduction = Math.floor((grossIncome - 100_000) / 2);
    personalAllowance = Math.max(0, fullAllowance - reduction);
  }

  // First, record the personal allowance usage (0% band)
  const paUsed = Math.min(grossIncome, personalAllowance);
  if (paUsed > 0) {
    breakdown.push({ band: 'Personal Allowance', taxable: paUsed, tax: 0 });
  }

  const taxableIncome = Math.max(0, grossIncome - personalAllowance);

  const { basicRate, higherRate, additionalRate } = BANDS;
  if (grossIncome > basicRate.lower) {
    const basicBreakdown = calcBasicRate(grossIncome, taxableIncome, personalAllowance);
    breakdown.push(basicBreakdown);
    tax += basicBreakdown.tax;
  }

  if (grossIncome > higherRate.lower) {
    const higherBreakdown = calcHigherRate(grossIncome, taxableIncome);
    breakdown.push(higherBreakdown);
    tax += higherBreakdown.tax;
  }

  if (grossIncome > additionalRate.lower) {
    const additionalBreakdown = calcAdditionalRate(grossIncome);
    breakdown.push(additionalBreakdown);
    tax += additionalBreakdown.tax;
  }

  return {
    tax,
    breakdown,
  };
}

function calcBasicRate(grossIncome: number, taxableIncome: number, personalAllowance: number): Breakdown {
  const { basicRate } = BANDS;
  const adjustedIncome = taxableIncome + personalAllowance;
  const upper = grossIncome > basicRate.upper ? basicRate.upper : adjustedIncome;
  const taxable = upper - basicRate.lower;
  const tax = taxable * basicRate.rate;

  return {
    band: 'Basic Rate',
    taxable,
    tax
  };
}

function calcHigherRate(grossIncome: number, taxableIncome: number): Breakdown {
  const { basicRate, higherRate } = BANDS;
  const basicWidth = basicRate.upper - basicRate.lower;
  const upper = grossIncome > higherRate.upper ? higherRate.upper : taxableIncome;
  const taxable = upper - basicWidth;
  const tax = taxable * higherRate.rate;

  return {
    band: 'Higher Rate',
    taxable,
    tax
  };
}

function calcAdditionalRate(taxableIncome: number): Breakdown {
  const { additionalRate } = BANDS;
  const taxable = taxableIncome - additionalRate.lower;
  const tax = taxable * additionalRate.rate;

  return {
    band: 'Additional Rate',
    taxable,
    tax,
  };
}
