import { Injectable } from '@angular/core';

export interface IncomeTax {
  tax: number;
  effectiveRate: number; // 0-100
  breakdown: Breakdown[];
}

export interface Breakdown {
  band: string;
  taxedAt: number;
  tax: number;
}

@Injectable()
export class IncomeTaxCalculator {

  // UK tax bands (2025/2026 FY)
  private bands = [
    { name: 'Personal Allowance', lower: 0, upper: 12570, rate: 0 },
    { name: 'Basic rate', lower: 12570, upper: 50270, rate: 0.20 },
    { name: 'Higher rate', lower: 50270, upper: 125140, rate: 0.40 },
    { name: 'Additional rate', lower: 125140, upper: Infinity, rate: 0.45 }
  ];

  public calculate(income: number): IncomeTax {
    const breakdown: Breakdown[] = [];
    let tax = 0;

    const fullAllowance = this.bands[0].upper; // 12,570
    let personalAllowance = fullAllowance;
    if (income > 100_000) {
      const reduction = Math.floor((income - 100_000) / 2);
      personalAllowance = Math.max(0, fullAllowance - reduction);
    }

    for (const b of this.bands) {
      const bandLower = b.lower;
      let bandUpper;

      if (income > b.upper) {
        bandUpper = b.upper;
      } else {
        bandUpper = b.upper === Infinity
          ? Infinity
          : b.upper - personalAllowance;
      }

      // If income < PA, record the taxable amount as income (but taxed at 0%)
      let taxableInBand: number;
      if (b.lower === 0 && income < personalAllowance) {
        taxableInBand = income;
      } else {
        const cappedUpper = Math.min(income, bandUpper);
        taxableInBand = Math.max(0, cappedUpper - bandLower);
      }

      const bandTax = taxableInBand * b.rate;
      breakdown.push({ band: b.name, taxedAt: taxableInBand, tax: bandTax });
      tax += bandTax;

      // Debug
      console.table({ bandName: b.name, bandLower, bandUpper, taxableInBand, bandTax });
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;

    console.log('breakdown: ', breakdown);
    return {
      tax,
      effectiveRate,
      breakdown,
    }
  }
}
