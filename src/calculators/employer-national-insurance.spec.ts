import { describe, test, expect } from "vitest";
import { calculateEmployerNationalInsurance } from "./employer-national-insurance";

describe("calculateEmployerNationalInsurance", () => {
  test("returns zero tax and empty breakdown when income is zero", () => {
    const res = calculateEmployerNationalInsurance(0);
    expect(res.tax).toBe(0);
    expect(res.breakdown).toHaveLength(0);
  });

  test("returns zero tax when income is at or below the secondary threshold (£9,100)", () => {
    const res = calculateEmployerNationalInsurance(9100);
    expect(res.tax).toBe(0);
    expect(res.breakdown).toHaveLength(0);
  });

  test("returns zero tax when income is below the secondary threshold", () => {
    const res = calculateEmployerNationalInsurance(5000);
    expect(res.tax).toBe(0);
    expect(res.breakdown).toHaveLength(0);
  });

  test("calculates 13.8% on earnings above £9,100 for income of £30,000", () => {
    const res = calculateEmployerNationalInsurance(30_000);
    // Taxable = 30000 - 9100 = 20900 at 13.8% = 2884.20
    expect(res.tax).toBeCloseTo(2884.2, 2);
    expect(res.breakdown).toHaveLength(1);
    expect(res.breakdown[0].band).toBe("Above Secondary Threshold");
    expect(res.breakdown[0].taxable).toBe(20900);
    expect(res.breakdown[0].tax).toBeCloseTo(2884.2, 2);
  });

  test("calculates 13.8% on earnings above £9,100 for income of £50,000", () => {
    const res = calculateEmployerNationalInsurance(50_000);
    // Taxable = 50000 - 9100 = 40900 at 13.8% = 5644.20
    expect(res.tax).toBeCloseTo(5644.2, 2);
    expect(res.breakdown[0].taxable).toBe(40900);
  });

  test("calculates correctly for a high earner (£150,000)", () => {
    const res = calculateEmployerNationalInsurance(150_000);
    // Taxable = 150000 - 9100 = 140900 at 13.8% = 19444.20
    expect(res.tax).toBeCloseTo(19444.2, 2);
    expect(res.breakdown[0].taxable).toBe(140900);
  });

  test("income just above the threshold produces a small positive tax", () => {
    const res = calculateEmployerNationalInsurance(9200);
    // Taxable = 100 at 13.8% = 13.80
    expect(res.tax).toBeCloseTo(13.8, 2);
    expect(res.breakdown).toHaveLength(1);
  });

  test("returns a single breakdown entry for income above threshold", () => {
    const res = calculateEmployerNationalInsurance(40_000);
    expect(res.breakdown).toHaveLength(1);
    expect(res.breakdown[0].band).toBe("Above Secondary Threshold");
  });
});
