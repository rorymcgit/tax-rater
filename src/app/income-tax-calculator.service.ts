import { Injectable } from '@angular/core';

export interface IncomeTax {
  tax: number;
  effectiveRate: number; // 0-100
  breakdown: Breakdown[];
}

export interface Breakdown {
  band: string;
  taxable: number;
  tax: number;
}

@Injectable()
export class IncomeTaxCalculator {

  // UK tax bands (2025/2026 FY)
  private readonly bands = {
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

  private calcBasicRate(grossIncome: number, taxableIncome: number, personalAllowance: number): Breakdown {
    const { basicRate } = this.bands;
    const adjustedIncome = taxableIncome + personalAllowance;
    const upper = grossIncome > basicRate.upper ? basicRate.upper : adjustedIncome;
    const taxable = upper - basicRate.lower;
    const tax = taxable * basicRate.rate;

    // Debug
    console.table({
      bandName: 'Basic Rate',
      taxable,
      tax
    });

    return {
      band: 'Basic Rate',
      taxable,
      tax
    }
  }

  private calcHigherRate(grossIncome: number, taxableIncome: number): Breakdown {
    const {basicRate, higherRate } = this.bands;
    const basicWidth = basicRate.upper - basicRate.lower;
    const upper = grossIncome > higherRate.upper ? higherRate.upper : taxableIncome;
    const taxable = upper - basicWidth;
    const tax = taxable * higherRate.rate;

    // Debug
    console.table({
      bandName: 'Higher Rate',
      taxable,
      tax
    });

    return {
      band: 'Higher Rate',
      taxable,
      tax
    }
  }

  private calcAdditionalRate(taxableIncome: number): Breakdown {
    const { additionalRate } = this.bands;
    const taxable = taxableIncome - additionalRate.lower;
    const tax = taxable * additionalRate.rate;

    // Debug
    console.table({
      bandName: 'Additional Rate',
      taxable,
      tax
    });

    return {
      band: 'Additional Rate',
      taxable,
      tax,
    }
  }

  public calculate(grossIncome: number): IncomeTax {
    const breakdown: Breakdown[] = [];
    let tax = 0;

    const fullAllowance = this.bands.personalAllowance.upper;
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
    console.log('paUsed: ', paUsed);
    console.log('taxableIncome: ', taxableIncome);

    const { basicRate, higherRate, additionalRate } = this.bands;
    if (grossIncome > basicRate.lower) {
      const basicBreakdown = this.calcBasicRate(grossIncome, taxableIncome, personalAllowance);
      breakdown.push(basicBreakdown);
      tax += basicBreakdown.tax;
    }

    if (grossIncome > higherRate.lower) {
      const higherBreakdown = this.calcHigherRate(grossIncome, taxableIncome);
      breakdown.push(higherBreakdown);
      tax += higherBreakdown.tax;
    }

    if (grossIncome > additionalRate.lower) {
      const additionalBreakdown = this.calcAdditionalRate(grossIncome);
      breakdown.push(additionalBreakdown);
      tax += additionalBreakdown.tax;
    }


    const effectiveRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;

    console.table(breakdown);
    return {
      tax,
      effectiveRate,
      breakdown,
    };
  }
}
