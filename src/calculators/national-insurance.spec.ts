import { describe, test, expect } from 'vitest';
import { calculateNationalInsurance } from './national-insurance';

describe('NationalInsuranceCalculator', () => {
  test('Bottom + Mid rates applied (income: £40,000)', () => {
    const res = calculateNationalInsurance(40_000);
    // Taxable = 40000 - 12584 = 27416 at 8% = 2193.28
    expect(res.tax).toBe(2193.28);
  });
});
