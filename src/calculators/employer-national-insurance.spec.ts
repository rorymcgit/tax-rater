import { describe, it, expect } from "vitest";
import { calculateEmployerNationalInsurance } from "./employer-national-insurance";

describe("calculateEmployerNationalInsurance", () => {
  it("returns 0 for income at or below secondary threshold (£9,100)", () => {
    expect(calculateEmployerNationalInsurance(9_100).tax).toBe(0);
    expect(calculateEmployerNationalInsurance(0).tax).toBe(0);
    expect(calculateEmployerNationalInsurance(5_000).tax).toBe(0);
  });

  it("returns empty breakdown for income at or below threshold", () => {
    expect(calculateEmployerNationalInsurance(9_100).breakdown).toHaveLength(0);
  });

  it("charges 13.8% on earnings above £9,100", () => {
    // £1,000 above threshold: 1000 * 0.138 = £138
    expect(calculateEmployerNationalInsurance(10_100).tax).toBeCloseTo(138, 2);
  });

  it("calculates correctly for a typical salary (£30,000)", () => {
    // (30000 - 9100) * 0.138 = 20900 * 0.138 = 2884.20
    expect(calculateEmployerNationalInsurance(30_000).tax).toBeCloseTo(2_884.2, 2);
  });

  it("calculates correctly for £50,000", () => {
    // (50000 - 9100) * 0.138 = 40900 * 0.138 = 5644.20
    expect(calculateEmployerNationalInsurance(50_000).tax).toBeCloseTo(5_644.2, 2);
  });

  it("calculates correctly for a high earner (£150,000)", () => {
    // (150000 - 9100) * 0.138 = 140900 * 0.138 = 19444.20
    expect(calculateEmployerNationalInsurance(150_000).tax).toBeCloseTo(19_444.2, 2);
  });

  it("breakdown contains a single band entry above threshold", () => {
    const result = calculateEmployerNationalInsurance(30_000);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].taxable).toBeCloseTo(20_900, 2);
    expect(result.breakdown[0].tax).toBeCloseTo(2_884.2, 2);
  });

  it("exactly £10,000 above threshold: tax = 10000 * 0.138", () => {
    expect(calculateEmployerNationalInsurance(19_100).tax).toBe(10_000 * 0.138);
  });
});
