import { NationalInsuranceCalculator } from './national-insurance-calculator.service';

describe('NationalInsuranceCalculator', () => {
  let calc: NationalInsuranceCalculator;

  beforeEach(() => {
    calc = new NationalInsuranceCalculator();
  });

  test('Bottom + Mid rates applied (income: £40,000', () => {
    const res = calc.calculate(40_000);
    expect(res.tax).toBe(2194.40);
  });
});
