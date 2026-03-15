import { describe, it, expect } from "vitest";
import { calculateDividendTax } from "./dividend-tax";

describe("calculateDividendTax", () => {
  it("returns 0 for zero dividend income", () => {
    expect(calculateDividendTax(0, 50_000).tax).toBe(0);
    expect(calculateDividendTax(0, 0).tax).toBe(0);
  });

  it("returns 0 for dividends within the £500 allowance", () => {
    expect(calculateDividendTax(500, 40_000).tax).toBe(0);
    expect(calculateDividendTax(300, 40_000).tax).toBe(0);
  });

  it("allowance band appears in breakdown", () => {
    const result = calculateDividendTax(500, 40_000);
    const allowance = result.breakdown.find((b) => b.band.includes("Allowance"));
    expect(allowance).toBeDefined();
    expect(allowance!.taxable).toBe(500);
    expect(allowance!.tax).toBe(0);
  });

  it("taxes dividends above allowance at basic rate when salary is in basic band", () => {
    // Salary £30,000: basic band used = 30000 - 12570 = 17430; space = 37700 - 17430 = 20270
    // Dividends £2,000: £500 allowance + £1,500 at 8.75% = £131.25
    const result = calculateDividendTax(2_000, 30_000);
    expect(result.tax).toBeCloseTo(131.25, 2);
  });

  it("dividends span basic and higher rate bands", () => {
    // Salary £45,000: basic band space = 50270 - 45000 = 5270
    // Dividends £10,000: £500 allowance, then £5,270 at 8.75%, then £4,230 at 33.75%
    const basicTax = 5_270 * 0.0875;
    const higherTax = 4_230 * 0.3375;
    const result = calculateDividendTax(10_000, 45_000);
    expect(result.tax).toBeCloseTo(basicTax + higherTax, 2);
  });

  it("salary already in higher rate — dividends taxed at higher rate from the start", () => {
    // Salary £60,000 (fully above basic band): no basic band space
    // Dividends £5,000: £500 allowance + £4,500 at 33.75% = £1518.75
    const result = calculateDividendTax(5_000, 60_000);
    expect(result.tax).toBeCloseTo(4_500 * 0.3375, 2);
  });

  it("dividends reach additional rate band", () => {
    // Salary £125,140 (fully in additional rate): no basic or higher band space
    // Dividends £1,000: £500 allowance + £500 at 39.35% = £196.75
    const result = calculateDividendTax(1_000, 125_140);
    expect(result.tax).toBeCloseTo(500 * 0.3935, 2);
  });

  it("zero salary — dividends use full bands from scratch", () => {
    // Dividends £60,000: £500 allowance, then basic band space = 50270 - 12570 = 37700
    // £500 allowance + £37,700 at 8.75% + £21,800 at 33.75%
    const basicTax = 37_700 * 0.0875;
    const higherTax = 21_800 * 0.3375;
    const result = calculateDividendTax(60_000, 0);
    expect(result.tax).toBeCloseTo(basicTax + higherTax, 2);
  });

  it("breakdown tax entries sum to total tax", () => {
    const result = calculateDividendTax(15_000, 40_000);
    const sumFromBreakdown = result.breakdown.reduce((sum, b) => sum + b.tax, 0);
    expect(sumFromBreakdown).toBeCloseTo(result.tax, 5);
  });
});
