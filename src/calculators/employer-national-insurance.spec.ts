import { describe, it, expect } from "vitest";
import { calculateEmployerNationalInsurance } from "./employer-national-insurance";

// Annual thresholds
const ST = 96 * 52;   // £4,992 — Category A/B/C/J
const UST = 481 * 52; // £25,012 — Category D/E/F/I/K/L/N/S
const UEL = 967 * 52; // £50,284 — Category H/M/V/Z

describe("calculateEmployerNationalInsurance", () => {
  describe("Category A (standard — threshold £4,992)", () => {
    it("returns 0 at or below the secondary threshold", () => {
      expect(calculateEmployerNationalInsurance(ST, "A").tax).toBe(0);
      expect(calculateEmployerNationalInsurance(0, "A").tax).toBe(0);
    });

    it("charges 15% above £4,992", () => {
      // £10,000 above threshold: 10000 * 0.15 = 1500
      expect(calculateEmployerNationalInsurance(ST + 10_000, "A").tax).toBeCloseTo(10_000 * 0.15, 2);
    });

    it("typical salary £30,000", () => {
      // (30000 - 4992) * 0.15 = 25008 * 0.15 = 3751.20
      expect(calculateEmployerNationalInsurance(30_000, "A").tax).toBeCloseTo(25_008 * 0.15, 2);
    });

    it("defaults to Category A when no category given", () => {
      expect(calculateEmployerNationalInsurance(30_000).tax).toBe(
        calculateEmployerNationalInsurance(30_000, "A").tax,
      );
    });
  });

  describe("Category B/C/J (same threshold as A)", () => {
    it("Category B matches Category A", () => {
      expect(calculateEmployerNationalInsurance(30_000, "B").tax).toBe(
        calculateEmployerNationalInsurance(30_000, "A").tax,
      );
    });

    it("Category J matches Category A", () => {
      expect(calculateEmployerNationalInsurance(30_000, "J").tax).toBe(
        calculateEmployerNationalInsurance(30_000, "A").tax,
      );
    });
  });

  describe("Category D (upper secondary threshold £25,012)", () => {
    it("returns 0 below upper secondary threshold", () => {
      expect(calculateEmployerNationalInsurance(UST, "D").tax).toBe(0);
      expect(calculateEmployerNationalInsurance(20_000, "D").tax).toBe(0);
    });

    it("charges 15% above £25,012", () => {
      expect(calculateEmployerNationalInsurance(UST + 10_000, "D").tax).toBeCloseTo(10_000 * 0.15, 2);
    });

    it("a salary that would be taxed under Category A is not taxed under Category D", () => {
      const income = 20_000; // above ST, below UST
      expect(calculateEmployerNationalInsurance(income, "A").tax).toBeGreaterThan(0);
      expect(calculateEmployerNationalInsurance(income, "D").tax).toBe(0);
    });
  });

  describe("Category H (upper earnings limit threshold £50,284)", () => {
    it("returns 0 at or below UEL", () => {
      expect(calculateEmployerNationalInsurance(UEL, "H").tax).toBe(0);
      expect(calculateEmployerNationalInsurance(40_000, "H").tax).toBe(0);
    });

    it("charges 15% above £50,284", () => {
      expect(calculateEmployerNationalInsurance(UEL + 10_000, "H").tax).toBeCloseTo(10_000 * 0.15, 2);
    });
  });

  describe("breakdown", () => {
    it("returns empty breakdown when no tax due", () => {
      expect(calculateEmployerNationalInsurance(1_000, "A").breakdown).toHaveLength(0);
    });

    it("returns single band entry when tax is due", () => {
      const result = calculateEmployerNationalInsurance(30_000, "A");
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].taxable).toBeCloseTo(30_000 - ST, 2);
    });
  });
});
