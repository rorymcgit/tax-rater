import { IncomeTaxCalculator } from './income-tax-calculator.service';

describe('IncomeTaxCalculator', () => {
  let calc: IncomeTaxCalculator;

  beforeEach(() => {
    calc = new IncomeTaxCalculator();
  });

  test('Income of 0 returns zero tax', () => {
    const res = calc.calculate(0);
    const taxes = res.breakdown.map(bd => bd.tax);
    const taxable = res.breakdown.map(bd => bd.taxable);

    expect(taxes.every(tax => tax === 0)).toBe(true);
    expect(taxable.every(taxable => taxable === 0)).toBe(true);
    expect(res.tax).toBe(0);
  });

  test('Under personal allowance (income: £10,000) -> no tax', () => {
    const res = calc.calculate(10_000);

    // Breakdown should show personal allowance used = income
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa).toBeDefined();
    expect(pa!.taxable).toBe(10_000);
    expect(res.tax).toBe(0);
  });

  test('Basic rate only (income: £20,000)', () => {
    const res = calc.calculate(20_000);

    // Taxable above PA = 20000 - 12570 = 7430 at 20% => 1486
    expect(res.tax).toBe(1486);
    const expectedEffectiveRate = (1486 / 20000) * 100;

    // Taxed amounts should sum to income
    const totalTaxed = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(totalTaxed).toBeCloseTo(20_000, 5);
  });

  test('Higher rate incurred (income: £60,000)', () => {
    const res = calc.calculate(60_000);

    // Basic full width 37700 at 20% = 7540
    // Remaining 60000 - 12570 - 37700 = 9730 at 40% = 3892
    const expectedTax = 7540 + 3892;
    expect(res.tax).toBe(expectedTax); // 11,432
  });

  test('Higher rate, just below tapering (income: £99,000)', () => {
    const res = calc.calculate(99_000);
    expect(res.tax).toBe(27_032);
  });

  test('Tapering above 100k (income: £110,000) reduces personal allowance', () => {
    const res = calc.calculate(110_000);

    // Reduction = floor((110000 - 100000)/2) = 5000 => PA = 12570 - 5000 = 7570
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa!.taxable).toBe(7570);

    // Taxable remainder should equal income - PA
    const taxedTotal = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(taxedTotal).toBe(110_000);
    expect(res.tax).toBe(33_432);
    // expect(res.effectiveRate).toBe(todo);
  });

  test('Further tapering above 100k (income: £124,000) reduces personal allowance', () => {
    const res = calc.calculate(124_000);

    // Reduction = floor((124000 - 100000)/2) = 12000 => PA = 12570 - 12000 = 570
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa!.taxable).toBe(570);

    // Taxable remainder should equal income - PA
    const taxedTotal = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(taxedTotal).toBe(124_000);
    expect(res.tax).toBe(41_832);
    // expect(res.effectiveRate).toBe(todo);
  });

  test('Full tapering above 100k (income: £125,140) reduces personal allowance to 0', () => {
    const res = calc.calculate(125_140);
    expect(res.tax).toBe(42_516);
  });

  // test('Exact thresholds: at PA (12,570), at basic->higher (50,270), at higher->additional (125,140)', () => {
  //   const resPA = calc.calculate(12_570);
  //   expect(resPA.tax).toBe(0);

  //   const resBasicTop = calc.calculate(50_270);
  //   // taxable above PA = 50270 - 12570 = 37700 @20% = 7540
  //   expect(resBasicTop.tax).toBe(7540);

  //   const resHigherTop = calc.calculate(125_140);
  //   // taxable above PA: 125140 - 12570 = 112570
  //   // basic: 37700@20% = 7540; higher: (125140 - 50270)=74870@40% = 29948
  //   expect(resHigherTop.tax).toBe(7540 + 29948);
  // });

  // test('Taper to zero: income that reduces PA to 0', () => {
  //   // Find income where reduction >= 12570 -> (income - 100000)/2 >=12570 => income >= 100000 + 25140 = 125140
  //   const res = calc.calculate(125_140);
  //   const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
  //   // PA should be 0 at or above this income
  //   expect(pa!.taxedAt).toBe(0);
  // });

  // test('Fractional income preserved and calculated', () => {
  //   const income = 12345.67;
  //   const res = calc.calculate(income);
  //   // ensure effectiveRate is computed and tax >= 0
  //   expect(res.tax).toBeGreaterThanOrEqual(0);
  //   const totalTaxed = res.breakdown.reduce((a, b) => a + b.taxedAt, 0);
  //   expect(totalTaxed).toBeCloseTo(income, 6);
  // });

  // test('Negative income treated as zero', () => {
  //   const res = calc.calculate(-5000);
  //   expect(res.tax).toBe(0);
  //   expect(res.effectiveRate).toBe(0);
  // });

  test('Additional Rate (income: £200_000)', () => {
    const res = calc.calculate(200_000);

    // With PA tapered to 0 for 200k, taxable = 200k
    // basic: 37700 at 20% = 7540
    // higher: 125140 - 37770 = 87440 at 40% = 34,976
    // additional: 200000 - 125140 = 74860 at 45% = 33,687
    const expectedTax = 7540 + 34976 + 33687;
    expect(res.tax).toBe(expectedTax); // 76,203
  });
});
