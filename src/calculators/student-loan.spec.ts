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
    it('plan1: returns 0 at or below £26,065', () => {
      expect(calculateStudentLoan(26_065, 'plan1')).toBe(0);
      expect(calculateStudentLoan(10_000, 'plan1')).toBe(0);
      expect(calculateStudentLoan(0, 'plan1')).toBe(0);
    });

    it('plan2: returns 0 at or below £28,470', () => {
      expect(calculateStudentLoan(28_470, 'plan2')).toBe(0);
      expect(calculateStudentLoan(15_000, 'plan2')).toBe(0);
      expect(calculateStudentLoan(0, 'plan2')).toBe(0);
    });

    it('plan4: returns 0 at or below £32,745', () => {
      expect(calculateStudentLoan(32_745, 'plan4')).toBe(0);
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
    it('plan1: 9% on income above £26,065', () => {
      // £35,000 income: (35000 - 26065) * 0.09 = 8935 * 0.09 = 804.15
      expect(calculateStudentLoan(35_000, 'plan1')).toBeCloseTo(804.15, 2);
    });

    it('plan2: 9% on income above £28,470', () => {
      // £40,000 income: (40000 - 28470) * 0.09 = 11530 * 0.09 = 1037.70
      expect(calculateStudentLoan(40_000, 'plan2')).toBeCloseTo(1037.7, 2);
    });

    it('plan4: 9% on income above £32,745', () => {
      // £50,000 income: (50000 - 32745) * 0.09 = 17255 * 0.09 = 1552.95
      expect(calculateStudentLoan(50_000, 'plan4')).toBeCloseTo(1552.95, 2);
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
      const income = 36_065; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan1')).toBe(10_000 * 0.09);
    });

    it('plan2 applies exactly 9% above the threshold', () => {
      const income = 38_470; // exactly £10,000 above threshold
      expect(calculateStudentLoan(income, 'plan2')).toBe(10_000 * 0.09);
    });

    it('plan4 applies exactly 9% above the threshold', () => {
      const income = 42_745; // exactly £10,000 above threshold
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
