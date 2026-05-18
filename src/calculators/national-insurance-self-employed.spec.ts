import { describe, test, expect } from 'vitest';
import { calculateSelfEmployedNI } from './national-insurance-self-employed';

describe('calculateSelfEmployedNI', () => {
  test('profit at or below £12,570 → class2 = 0, class4 = 0, total = 0', () => {
    const res = calculateSelfEmployedNI(12_570);
    expect(res.class2).toBe(0);
    expect(res.class4).toBe(0);
    expect(res.total).toBe(0);
    expect(res.breakdown).toHaveLength(0);
  });

  test('profit below threshold (£10,000) → all zero', () => {
    const res = calculateSelfEmployedNI(10_000);
    expect(res.class2).toBe(0);
    expect(res.class4).toBe(0);
    expect(res.total).toBe(0);
  });

  test('profit in Class 4 mid band only (£30,000) → correct class2 + class4', () => {
    const res = calculateSelfEmployedNI(30_000);
    // Class 2: £189.80 (profit > £12,570)
    expect(res.class2).toBeCloseTo(189.80, 2);
    // Class 4 mid: (30000 - 12570) * 6% = 17430 * 0.06 = 1045.80
    expect(res.class4).toBeCloseTo(1045.80, 2);
    expect(res.total).toBeCloseTo(189.80 + 1045.80, 2);
  });

  test('profit above Class 4 upper band (£60,000) → correct class2 + class4', () => {
    const res = calculateSelfEmployedNI(60_000);
    // Class 2: £189.80
    expect(res.class2).toBeCloseTo(189.80, 2);
    // Class 4 mid: (50270 - 12570) * 6% = 37700 * 0.06 = 2262.00
    // Class 4 higher: (60000 - 50270) * 2% = 9730 * 0.02 = 194.60
    const expectedClass4 = 37_700 * 0.06 + 9_730 * 0.02;
    expect(res.class4).toBeCloseTo(expectedClass4, 2);
    expect(res.total).toBeCloseTo(189.80 + expectedClass4, 2);
  });

  test('flat Class 2 rate is £189.80/year (£3.65 × 52 weeks)', () => {
    const res = calculateSelfEmployedNI(20_000);
    expect(res.class2).toBe(3.65 * 52);
    expect(res.class2).toBeCloseTo(189.80, 2);
  });

  test('breakdown contains Class 2 entry when profit exceeds threshold', () => {
    const res = calculateSelfEmployedNI(30_000);
    const class2Entry = res.breakdown.find(b => b.band === 'Class 2 (flat rate)');
    expect(class2Entry).toBeDefined();
    expect(class2Entry?.tax).toBeCloseTo(189.80, 2);
  });

  test('breakdown contains Class 4 mid and higher entries when above upper band', () => {
    const res = calculateSelfEmployedNI(60_000);
    const midEntry = res.breakdown.find(b => b.band === 'Class 4 (6%)');
    const higherEntry = res.breakdown.find(b => b.band === 'Class 4 (2%)');
    expect(midEntry).toBeDefined();
    expect(higherEntry).toBeDefined();
    expect(midEntry?.taxable).toBeCloseTo(37_700, 2);
    expect(higherEntry?.taxable).toBeCloseTo(9_730, 2);
  });
});
