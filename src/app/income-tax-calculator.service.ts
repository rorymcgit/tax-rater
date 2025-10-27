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

    const fullAllowance = this.bands[0].upper;
    let personalAllowance = fullAllowance;
    if (income > 100_000) {
      const reduction = Math.floor((income - 100_000) / 2);
      personalAllowance = Math.max(0, fullAllowance - reduction);
    }

    // First, record the personal allowance usage (0% band)
    const paUsed = Math.min(income, personalAllowance);
    if (paUsed > 0) {
      breakdown.push({ band: 'Personal Allowance', taxedAt: paUsed, tax: 0 });
    }

    // Taxable income remaining after PA
    let remainingTaxable = Math.max(0, income - personalAllowance);

    // Iterate over the non-zero bands, we have already pushed PA
    const non_zero_bands = this.bands.slice(1);
    for (const b of non_zero_bands) {
      // Allocate remaining taxable income into the fixed-width bands (basic/higher/additional)
      const bandLower = b.lower;
      const width = b.upper === Infinity ? Infinity : (b.upper - b.lower);
      const taxedAt = Math.max(0, Math.min(remainingTaxable, width));
      const bandTax = taxedAt * b.rate;

      if (taxedAt > 0) {
        breakdown.push({ band: b.name, taxedAt, tax: bandTax });
        tax += bandTax;
        remainingTaxable -= taxedAt;
      } else {
        // still push a zero row for consistency with previous behaviour
        breakdown.push({ band: b.name, taxedAt: 0, tax: 0 });
      }

      // Debug
      console.table({ bandName: b.name, bandLower, bandUpper: b.upper === Infinity ? Infinity : b.upper, taxedAt, bandTax });

      if (remainingTaxable <= 0) {
        break;
      }
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;

    // console.log preserved for debugging parity
    console.log('breakdown: ', breakdown);
    return {
      tax,
      effectiveRate,
      breakdown,
    };
  }
}
