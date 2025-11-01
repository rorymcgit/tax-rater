import { Injectable } from '@angular/core';
import { Breakdown, Tax } from './tax-breakdown.interface';


/*
  NOTE: This is EMPLOYEE NICs (Class 1) only

  TODO: Add other categories (+ checkboxes/dropdowns in UI to help categorise user)
  TODO: Add self-employed rates
  TODO: Add employer side too

  https://www.gov.uk/national-insurance-rates-letters
  https://www.gov.uk/national-insurance-rates-letters/category-letters


  Class 1 [Category A]
    rate    weekly threshold    monthly threshold
    0%      £125 to £242        £542 to £1,048
    8%      £242.01 to £967     £1,048.01 to £4,189
    2%      £967+               £4,189+
  */
@Injectable()
export class NationalInsuranceEmployeeCalculator {

  // UK national insurance bands (2025/2026 FY)
  // FYI this is for Category A only - which _most_ people fit into
  private readonly EMPLOYEE_BANDS = {
    bottom: {
      lower: 0,
      upper: 12584,
      rate: 0
    },
    mid: {
      lower: 12584,
      upper: 50284,
      rate: 0.08
    },
    higher: {
      lower: 50284,
      upper: Infinity,
      rate: 0.02
    },
  };

  public calculate(income: number): Tax {
    let tax = 0;
    const breakdown: Breakdown[] = [];

    // Subtract the tax-free rate
    const taxable = Math.max(0, income - this.EMPLOYEE_BANDS.bottom.upper);  // 27,416

    // Early exit if nothing to tax
    if (taxable === 0)  {
      return {
        tax,
        breakdown,
      };
    }

    const { mid } = this.EMPLOYEE_BANDS;
    const midRange = mid.upper - mid.lower;   // 37,700
    const midTaxable = Math.min(taxable, midRange);
    const midTax = midTaxable * mid.rate;
    const midBreakdown = {
      band: 'Middle',
      taxable: midTaxable,
      tax: midTax
    }
    breakdown.push(midBreakdown);
    tax += midTax;

    console.table(breakdown);

    const { higher } = this.EMPLOYEE_BANDS;
    const higherTaxable = Math.max(0, income - this.EMPLOYEE_BANDS.higher.lower);
    if (higherTaxable === 0) {
      return {
        tax,
        breakdown
      };
    }

    const higherTax = higherTaxable * higher.rate;
    const higherBreakdown = {
      band: 'Higher',
      taxable: higherTaxable,
      tax: higherTax,
    };
    breakdown.push(higherBreakdown);
    tax += higherTax;

    return {
      tax,
      breakdown
    }
  }
}
