import { describe, test, expect } from 'vitest';
import { calculateIncomeTax } from './income-tax';

describe('IncomeTaxCalculator', () => {
  test('Income of 0 returns zero tax', () => {
    const res = calculateIncomeTax(0);
    const taxes = res.breakdown.map(bd => bd.tax);
    const taxable = res.breakdown.map(bd => bd.taxable);

    expect(taxes.every(tax => tax === 0)).toBe(true);
    expect(taxable.every(taxable => taxable === 0)).toBe(true);
    expect(res.tax).toBe(0);
  });

  test('Under personal allowance (income: £10,000) -> no tax', () => {
    const res = calculateIncomeTax(10_000);

    // Breakdown should show personal allowance used = income
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa).toBeDefined();
    expect(pa!.taxable).toBe(10_000);
    expect(res.tax).toBe(0);
  });

  test('Basic rate only (income: £20,000)', () => {
    const res = calculateIncomeTax(20_000);

    // Taxable above PA = 20000 - 12570 = 7430 at 20% => 1486
    expect(res.tax).toBe(1486);

    // Taxed amounts should sum to income
    const totalTaxed = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(totalTaxed).toBeCloseTo(20_000, 5);
  });

  test('Higher rate incurred (income: £60,000)', () => {
    const res = calculateIncomeTax(60_000);

    // Basic full width 37700 at 20% = 7540
    // Remaining 60000 - 12570 - 37700 = 9730 at 40% = 3892
    const expectedTax = 7540 + 3892;
    expect(res.tax).toBe(expectedTax); // 11,432
  });

  test('Higher rate, just below tapering (income: £99,000)', () => {
    const res = calculateIncomeTax(99_000);
    expect(res.tax).toBe(27_032);
  });

  test('Tapering above 100k (income: £110,000) reduces personal allowance', () => {
    const res = calculateIncomeTax(110_000);

    // Reduction = floor((110000 - 100000)/2) = 5000 => PA = 12570 - 5000 = 7570
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa!.taxable).toBe(7570);

    // Taxable remainder should equal income - PA
    const taxedTotal = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(taxedTotal).toBe(110_000);
    expect(res.tax).toBe(33_432);
  });

  test('Further tapering above 100k (income: £124,000) reduces personal allowance', () => {
    const res = calculateIncomeTax(124_000);

    // Reduction = floor((124000 - 100000)/2) = 12000 => PA = 12570 - 12000 = 570
    const pa = res.breakdown.find(b => b.band === 'Personal Allowance');
    expect(pa!.taxable).toBe(570);

    // Taxable remainder should equal income - PA
    const taxedTotal = res.breakdown.reduce((a, b) => a + b.taxable, 0);
    expect(taxedTotal).toBe(124_000);
    expect(res.tax).toBe(41_832);
  });

  test('Full tapering above 100k (income: £125,140) reduces personal allowance to 0', () => {
    const res = calculateIncomeTax(125_140);
    expect(res.tax).toBe(42_516);
  });

  test('Additional Rate (income: £200_000)', () => {
    const res = calculateIncomeTax(200_000);

    // With PA tapered to 0 for 200k, taxable = 200k
    // basic: 37700 at 20% = 7540
    // higher: 125140 - 37770 = 87440 at 40% = 34,976
    // additional: 200000 - 125140 = 74860 at 45% = 33,687
    const expectedTax = 7540 + 34976 + 33687;
    expect(res.tax).toBe(expectedTax); // 76,203
  });
});
