import { IncomeTaxCalculator } from './income-tax-calculator.service';

describe('IncomeTaxCalculator', () => {
  let calc: IncomeTaxCalculator;

  beforeEach(() => {
    calc = new IncomeTaxCalculator();
  });

  test('income 0 returns zero tax', () => {
    const res = calc.calculate(0);
    expect(res.tax).toBe(0);
    expect(res.effectiveRate).toBe(0);
    expect(res.breakdown.length).toBe(0);
  });

  test('under personal allowance (10000) -> no tax', () => {
    const res = calc.calculate(10000);
    expect(res.tax).toBe(0);
    // breakdown should show personal allowance used = income
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa).toBeDefined();
    expect(pa!.taxedAt).toBe(10000);
  });

  test('Basic rate only (income: £20,000)', () => {
    const res = calc.calculate(20_000);
    // console.log(res);

    // Taxable above PA = 20000 - 12570 = 7430 at 20% => 1486
    expect(res.tax).toBe(1486);
    const expectedEffectiveRate = (1486 / 20000) * 100;
    expect(res.effectiveRate).toBeCloseTo(expectedEffectiveRate, 5);

    // Taxed amounts should sum to income
    const totalTaxed = res.breakdown.reduce((s, b) => s + b.taxedAt, 0);
    expect(totalTaxed).toBeCloseTo(20_000, 5);
  });

  test('Higher rate incurred (income: £60,000)', () => {
    const res = calc.calculate(60_000);

    // Basic full width 37700 at 20% = 7540
    // Remaining 60000 - 12570 - 37700 = 9730 at 40% = 3892
    const expectedTax = 11432; // 7540 + 3892
    expect(res.tax).toBe(expectedTax);
  });

  // test('tapering above 100k (110000) reduces personal allowance', () => {
  //   const res = calc.calculate(110000);
  //   // reduction = floor((110000 - 100000)/2) = 5000 => PA = 12570 - 5000 = 7570
  //   const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
  //   expect(pa).toBeDefined();
  //   expect(pa!.taxedAt).toBe(7570);
  //   // taxable remainder should equal income - PA
  //   const taxedTotal = res.breakdown.reduce((s, b) => s + b.taxedAt, 0);
  //   expect(taxedTotal).toBeCloseTo(110000, 6);
  // });

  // test('large income uses additional rate (200000)', () => {
  //   const res = calc.calculate(200000);
  //   // With PA tapered to 0 for 200k, taxable = 200k
  //   // basic: 37700@20% = 7540
  //   // higher: 74870@40% = 29948
  //   // additional: remainder = 200000 - 112570 = 87430 @45% = 39343.5
  //   const expectedTax = 7540 + 29948 + 39343.5;
  //   expect(res.tax).toBeCloseTo(expectedTax, 2);
  // });
});
