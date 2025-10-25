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

    //  const fullAllowance = this.bands[0].upper; // 12,570
    //  let personalAllowance = fullAllowance;
    //  if (income > 100_000) {
    //    const reduction = Math.floor((income - 100_000) / 2);
    //    personalAllowance = Math.max(0, fullAllowance - reduction);
    //  }

    //  for (const b of this.bands) {
    //   const bandLower = b.lower;
    //   const bandUpper = b.upper === Infinity ? Infinity : b.upper;
    //   let bandLower: number;
    //   let bandUpper: number;

    //   if (b.name === 'Personal Allowance') {
    //     bandLower = 0;
    //     bandUpper = personalAllowance;
    //   } else if (b.name === 'Basic Rate') {
    //     bandLower = personalAllowance;
    //     bandUpper = b.upper;
    //   } else {
    //     bandLower = b.lower;
    //     bandUpper = b.upper === Infinity ? Infinity : b.upper;
    //   }
    // }

    const fullAllowance = this.bands[0].upper; // 12,570
    let personalAllowance = fullAllowance;
    if (income > 100_000) {
      const reduction = Math.floor((income - 100_000) / 2);
      personalAllowance = Math.max(0, fullAllowance - reduction);
    }

    // Add Personal Allowance band (0%): show how much of income sits in the allowance
    const paUsed = Math.min(income, personalAllowance);
    if (paUsed > 0) {
      breakdown.push({ band: 'Personal Allowance', taxedAt: paUsed, tax: 0 });
    }

    // Taxable income after allowance
    let remainingTaxable = Math.max(0, income - personalAllowance);

    for (const band of this.bands) {
      const width = band.upper === Infinity
        ? Infinity
        : band.upper - band.lower;
      const taxedAt = Math.max(0, Math.min(remainingTaxable, width));
      const bandTax = taxedAt * band.rate;

      if (taxedAt > 0) {
        breakdown.push({ band: band.name, taxedAt, tax: bandTax });
        tax += bandTax;
        remainingTaxable -= taxedAt;
      }

      if (remainingTaxable <= 0) {
        break;
      }
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;
    return {
      tax,
      effectiveRate,
      breakdown,
    }
  }
}
