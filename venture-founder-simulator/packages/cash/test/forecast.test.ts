/** Hand-built forecast with exact, hand-checked numbers. Mirrors the example in doc 10, section 6. */
import { ACCOUNTS as A, Ledger, rupees as r } from "@vfs/ledger";
import { describe, expect, it } from "vitest";
import { describeShortfall, forecast13Week, forecastPeriods, suggestedBuffer } from "../src/forecast.js";
import type { CashItem } from "../src/items.js";

const item = (id: string, date: string, rupees: string, category: string, section: CashItem["section"], basis: CashItem["basis"] = "forecast"): CashItem =>
  ({ id, date, amount: r(rupees), label: category, category, section, basis });

const ledger = new Ledger();
ledger.post({
  date: "2026-11-13", memo: "Opening", source: "Opening",
  lines: [{ account: A.BANK, debit: r("500000"), credit: 0n }, { account: A.SHARE_CAPITAL, debit: 0n, credit: r("500000") }],
});

const items: CashItem[] = [
  item("a", "2026-11-16", "120000", "UPI/card settlements", "receipts"),
  item("b", "2026-11-20", "-80000", "GST", "payments", "scheduled"),
  item("c", "2026-12-01", "-300000", "Payroll", "payments", "scheduled"),
  item("d", "2026-12-05", "-162000", "Rent", "payments", "scheduled"),
  item("e", "2026-12-10", "-150000", "Capex", "investing"),
  item("f", "2026-12-14", "100000", "Aggregator payouts", "receipts"),
];

describe("13-week cash forecast", () => {
  const fc = forecast13Week({ ledger, asAt: "2026-11-13", items, buffer: r("300000") });

  it("uses a stub week then 13 Monday-to-Sunday weeks ending 14 Feb 2027", () => {
    const p = forecastPeriods("2026-11-13");
    expect(p[0]).toEqual({ label: "Stub", start: "2026-11-14", end: "2026-11-15" });
    expect(p[1]).toEqual({ label: "W1", start: "2026-11-16", end: "2026-11-22" });
    expect(p).toHaveLength(14);
    expect(p[13]!.end).toBe("2027-02-14");
  });

  it("rolls cash forward week by week", () => {
    expect(fc.opening).toBe(r("500000"));
    const w1 = fc.periods[1]!;
    expect(w1.inflows).toBe(r("120000"));
    expect(w1.outflows).toBe(r("-80000"));
    expect(w1.closing).toBe(r("540000"));
    expect(fc.periods[fc.periods.length - 1]!.closing).toBe(r("28000"));
    expect(fc.lowestPoint).toEqual({ date: "2026-12-10", closing: r("-72000") });
  });

  it("finds the first day below the buffer and explains it", () => {
    const s = fc.firstBelowBuffer!;
    expect(s.date).toBe("2026-12-01");
    expect(s.closing).toBe(r("240000"));
    expect(s.shortBy).toBe(r("60000"));
    expect(s.drivers.map((d) => d.id)).toEqual(["c"]);
    // Payroll is the only payment big enough, and deferring wages is not a lawful lever.
    expect(s.singleFixes).toHaveLength(0);
  });

  it("finds the first day below zero and suggests only lawful single fixes", () => {
    const s = fc.firstBelowZero!;
    expect(s.date).toBe("2026-12-10");
    expect(s.shortBy).toBe(r("72000"));
    expect(s.drivers.map((d) => d.id)).toEqual(["e"]);
    expect(s.singleFixes.map((f) => f.id)).toEqual(["e", "d"]); // capex first, then rent; never GST or payroll
  });

  it("spots receipts that slipped since the previous forecast", () => {
    const previous = forecast13Week({ ledger, asAt: "2026-11-13", items: items.map((i) => (i.id === "f" ? { ...i, date: "2026-12-09" } : i)), buffer: r("300000") });
    expect(previous.firstBelowZero).toBeNull(); // with the payout on time, cash never went negative
    const now = forecast13Week({ ledger, asAt: "2026-11-13", items, buffer: r("300000"), previous });
    expect(now.firstBelowZero!.delayedReceipts).toEqual([{ item: items[5], previousDate: "2026-12-09" }]);
    const text = describeShortfall(now.firstBelowZero!);
    expect(text).toContain("Cash goes negative");
    expect(text).toContain("10 Dec");
    expect(text).toContain("₹72,000.00");
    expect(text).toContain("Aggregator payouts");
  });

  it("suggests a buffer of four weeks of operating payments", () => {
    // GST 80,000 + payroll 3,00,000 + rent 1,62,000 within 28 days; capex excluded
    expect(suggestedBuffer(items, "2026-11-13")).toBe(r("542000"));
  });

  it("refuses items dated on or before the forecast date", () => {
    expect(() => forecast13Week({ ledger, asAt: "2026-11-13", items: [item("x", "2026-11-13", "1", "Other", "payments")], buffer: 0n })).toThrow();
  });
});
