import { describe, it, expect } from 'vitest';
import { calculateStudentLoan } from './student-loan';

describe('calculateStudentLoan', () => {
  describe('plan none', () => {
    it('returns 0 for any income when plan is none', () => {
      expect(calculateStudentLoan(0, 'none')).toBe(0);
      expect(calculateStudentLoan(50_000, 'none')).toBe(0);
      expect(calculateStudentLoan(150_000, 'none')).toBe(0);
    });
  });

  describe('income below threshold returns 0', () => {
    it('plan1: returns 0 at or below £24,990', () => {
      expect(calculateStudentLoan(24_990, 'plan1')).toBe(0);
      expect(calculateStudentLoan(10_000, 'plan1')).toBe(0);
      expect(calculateStudentLoan(0, 'plan1')).toBe(0);
    });

    it('plan2: returns 0 at or below £27,295', () => {
      expect(calculateStudentLoan(27_295, 'plan2')).toBe(0);
      expect(calculateStudentLoan(15_000, 'plan2')).toBe(0);
      expect(calculateStudentLoan(0, 'plan2')).toBe(0);
    });

    it('plan4: returns 0 at or below £31,395', () => {
      expect(calculateStudentLoan(31_395, 'plan4')).toBe(0);
      expect(calculateStudentLoan(20_000, 'plan4')).toBe(0);
      expect(calculateStudentLoan(0, 'plan4')).toBe(0);
    });

    it('plan5: returns 0 at or below £25,000', () => {
      expect(calculateStudentLoan(25_000, 'plan5')).toBe(0);
      expect(calculateStudentLoan(12_000, 'plan5')).toBe(0);
      expect(calculateStudentLoan(0, 'plan5')).toBe(0);
    });

    it('postgraduate: returns 0 at or below £21,000', () => {
      expect(calculateStudentLoan(21_000, 'postgraduate')).toBe(0);
      expect(calculateStudentLoan(10_000, 'postgraduate')).toBe(0);
      expect(calculateStudentLoan(0, 'postgraduate')).toBe(0);
    });
  });

  describe('mid-range income repayment calculations', () => {
    it('plan1: 9% on income above £24,990', () => {
      // £35,000 income: (35000 - 24990) * 0.09 = 10010 * 0.09 = 900.90
      expect(calculateStudentLoan(35_000, 'plan1')).toBeCloseTo(900.9, 2);
    });

    it('plan2: 9% on income above £27,295', () => {
      // £40,000 income: (40000 - 27295) * 0.09 = 12705 * 0.09 = 1143.45
      expect(calculateStudentLoan(40_000, 'plan2')).toBeCloseTo(1143.45, 2);
    });

    it('plan4: 9% on income above £31,395', () => {
      // £50,000 income: (50000 - 31395) * 0.09 = 18605 * 0.09 = 1674.45
      expect(calculateStudentLoan(50_000, 'plan4')).toBeCloseTo(1674.45, 2);
    });

    it('plan5: 9% on income above £25,000', () => {
      // £35,000 income: (35000 - 25000) * 0.09 = 10000 * 0.09 = 900
      expect(calculateStudentLoan(35_000, 'plan5')).toBeCloseTo(900, 2);
    });

    it('postgraduate: 6% on income above £21,000', () => {
      // £30,000 income: (30000 - 21000) * 0.06 = 9000 * 0.06 = 540
      expect(calculateStudentLoan(30_000, 'postgraduate')).toBeCloseTo(540, 2);
    });
  });

  describe('rate verification', () => {
    it('plan1 applies exactly 9% above the threshold', () => {
      const income = 34_990; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan1')).toBe(10_000 * 0.09);
    });

    it('plan2 applies exactly 9% above the threshold', () => {
      const income = 37_295; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan2')).toBe(10_000 * 0.09);
    });

    it('plan4 applies exactly 9% above the threshold', () => {
      const income = 41_395; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan4')).toBe(10_000 * 0.09);
    });

    it('plan5 applies exactly 9% above the threshold', () => {
      const income = 35_000; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan5')).toBe(10_000 * 0.09);
    });

    it('postgraduate applies exactly 6% above the threshold', () => {
      const income = 31_000; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'postgraduate')).toBe(10_000 * 0.06);
    });
  });
});
