import { describe, expect, it } from "vitest";
import { applyRate, divRoundHalfUp, formatINR, rupees } from "../src/money.js";

describe("money", () => {
  it("parses rupee strings into paise", () => {
    expect(rupees("1050")).toBe(105000n);
    expect(rupees("1,05,000.5")).toBe(10500050n);
    expect(rupees("₹ 12.05")).toBe(1205n);
    expect(rupees("-3.10")).toBe(-310n);
    expect(rupees(42)).toBe(4200n);
  });

  it("rejects amounts with more than two decimals or junk", () => {
    expect(() => rupees("1.005")).toThrow();
    expect(() => rupees("abc")).toThrow();
  });

  it("rounds half away from zero", () => {
    expect(divRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divRoundHalfUp(-5n, 2n)).toBe(-3n);
    expect(divRoundHalfUp(4n, 3n)).toBe(1n);
    expect(divRoundHalfUp(5n, 3n)).toBe(2n);
  });

  it("applies basis-point rates to the nearest paisa", () => {
    expect(applyRate(rupees("1000"), 250)).toBe(rupees("25")); // 2.5%
    expect(applyRate(1n, 5000)).toBe(1n); // 0.5 paisa rounds up
    expect(applyRate(rupees("999.99"), 900)).toBe(9000n); // 89.9991 -> 90.00
    expect(() => applyRate(100n, 2.5)).toThrow();
  });

  it("formats with Indian lakh and crore grouping", () => {
    expect(formatINR(rupees("1234567.89"))).toBe("₹12,34,567.89");
    expect(formatINR(rupees("123456789"))).toBe("₹12,34,56,789.00");
    expect(formatINR(rupees("999"))).toBe("₹999.00");
    expect(formatINR(rupees("-1000"))).toBe("-₹1,000.00");
    expect(formatINR(5n)).toBe("₹0.05");
  });
});
