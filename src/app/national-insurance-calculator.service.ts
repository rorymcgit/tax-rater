import { Injectable } from '@angular/core';
import { Tax } from './tax.interface';


/*
  NOTE: This is EMPLOYEE NICs (Class 1) only

  TODO: Add other categories
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
export class NationalInsuranceCalculator {

  // UK national insurance bands (2025/2026 FY)
  // FYI this is for Category "A" only - which _most_ people fit into
  // TODO add some checkboxes/fields to allow us to categorise the user
  private readonly BANDS = {
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

  }
}
