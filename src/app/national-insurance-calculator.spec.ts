import { NationalInsuranceEmployeeCalculator } from './national-insurance-calculator.service';

describe('NationalInsuranceCalculator', () => {
  let calc: NationalInsuranceEmployeeCalculator;

  beforeEach(() => {
    calc = new NationalInsuranceEmployeeCalculator();
  });

  test('Bottom + Mid rates applied (income: £40,000', () => {
    const res = calc.calculate(40_000);
    expect(res.tax).toBe(2194.40);
  });
});
