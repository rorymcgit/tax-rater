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
  // private bands = [
  //   { name: 'Personal Allowance', lower: 0, upper: 12570, rate: 0 },
  //   { name: 'Basic rate', lower: 12570, upper: 50270, rate: 0.20 },
  //   { name: 'Higher rate', lower: 50270, upper: 125140, rate: 0.40 },
  //   { name: 'Additional rate', lower: 125140, upper: Infinity, rate: 0.45 }
  // ];

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
    const pa = Math.min(grossIncome, personalAllowance);
    if (pa > 0) {
      breakdown.push({ band: 'Personal Allowance', taxable: pa, tax: 0 });
    }

    // Taxable income remaining after PA
    let taxableIncome = Math.max(0, grossIncome - personalAllowance);
    console.log('personal allowance: ', pa);
    console.log('taxableIncome: ', taxableIncome);

    const { basicRate, higherRate, additionalRate } = this.bands;

    if (grossIncome > basicRate.lower) {
      let taxable: number;
      if (grossIncome > basicRate.upper) {
        taxable = basicRate.upper - basicRate.lower;
      } else {
        taxable = (taxableIncome + personalAllowance) - basicRate.lower;
      }

      const bandTax = taxable * basicRate.rate;
      breakdown.push({ band: 'Basic Rate', taxable, tax: bandTax });
      tax += bandTax;

      // Debug
      console.table({
        bandName: 'Basic Rate',
        taxable,
        bandTax
      });
    }

    if (grossIncome > higherRate.lower) {
      let taxable: number;
      if (grossIncome > higherRate.upper) {
        taxable = higherRate.upper - higherRate.lower;
      } else {
        const basicWidth = basicRate.upper - basicRate.lower;
        taxable = taxableIncome - basicWidth;
      }

      const bandTax = taxable * higherRate.rate;
      breakdown.push({ band: 'Higher Rate', taxable, tax: bandTax });
      tax += bandTax;

      // Debug
      console.table({
        bandName: 'Higher Rate',
        taxable,
        bandTax
      });
    }

    if (grossIncome > additionalRate.lower) {
      const taxable = taxableIncome - additionalRate.lower;
      const bandTax = taxable * additionalRate.rate;
      breakdown.push({ band: 'Additional Rate', taxable, tax: bandTax });
      tax += bandTax;

      // Debug
      console.table({
        bandName: 'Additional Rate',
        taxable,
        bandTax
      });
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
