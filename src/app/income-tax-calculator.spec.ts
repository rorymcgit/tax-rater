import { IncomeTaxCalculator } from './income-tax-calculator.service';

describe('IncomeTaxCalculator', () => {
  let calc: IncomeTaxCalculator;

  beforeEach(() => {
    calc = new IncomeTaxCalculator();
  });

  test('Income of 0 returns zero tax', () => {
    const res = calc.calculate(0);
    const taxes = res.breakdown.map(bd => bd.tax);
    const taxedAt = res.breakdown.map(bd => bd.taxedAt);

    expect(taxes.every(tax => tax === 0)).toBe(true);
    expect(taxedAt.every(taxedAt => taxedAt === 0)).toBe(true);
    expect(res.tax).toBe(0);
    expect(res.effectiveRate).toBe(0);
  });

  test('Under personal allowance (income: £10,000) -> no tax', () => {
    const res = calc.calculate(10_000);

    // Breakdown should show personal allowance used = income
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa).toBeDefined();
    expect(pa!.taxedAt).toBe(10_000);
    expect(res.tax).toBe(0);
  });

  test('Basic rate only (income: £20,000)', () => {
    const res = calc.calculate(20_000);

    // Taxable above PA = 20000 - 12570 = 7430 at 20% => 1486
    expect(res.tax).toBe(1486);
    const expectedEffectiveRate = (1486 / 20000) * 100;
    expect(res.effectiveRate).toBeCloseTo(expectedEffectiveRate, 5);

    // Taxed amounts should sum to income
    const totalTaxed = res.breakdown.reduce((a, b) => a + b.taxedAt, 0);
    expect(totalTaxed).toBeCloseTo(20_000, 5);
  });

  test('Higher rate incurred (income: £60,000)', () => {
    const res = calc.calculate(60_000);

    // Basic full width 37700 at 20% = 7540
    // Remaining 60000 - 12570 - 37700 = 9730 at 40% = 3892
    const expectedTax = 11432; // 7540 + 3892
    expect(res.tax).toBe(expectedTax);
  });

  test('Tapering above 100k (income: £110,000) reduces personal allowance', () => {
    const res = calc.calculate(110_000);

    // Reduction = floor((110000 - 100000)/2) = 5000 => PA = 12570 - 5000 = 7570
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa!.taxedAt).toBe(7570);

    // Taxable remainder should equal income - PA
    const taxedTotal = res.breakdown.reduce((a, b) => a + b.taxedAt, 0);
    expect(taxedTotal).toBe(110_000);
    expect(res.tax).toBe(33432);
    // expect(res.effectiveRate).toBe(todo);
  });

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
