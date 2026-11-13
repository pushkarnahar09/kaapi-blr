import { describe, expect, it } from "vitest";
import { ACCOUNTS as A } from "../src/accounts.js";
import { cr, dr, Ledger, LedgerError } from "../src/journal.js";

const entry = (lines: ReturnType<typeof dr>[], date = "2026-11-13") => ({ date, memo: "test", source: "Test", lines });

describe("ledger validation", () => {
  it("accepts a balanced entry", () => {
    const l = new Ledger();
    const e = l.post(entry([dr(A.BANK, 100n), cr(A.SHARE_CAPITAL, 100n)]));
    expect(e.id).toBe(1);
    expect(l.debitBalance(A.BANK)).toBe(100n);
  });

  it.each([
    ["unbalanced", [dr(A.BANK, 100n), cr(A.SHARE_CAPITAL, 99n)]],
    ["single line", [dr(A.BANK, 0n), cr(A.SHARE_CAPITAL, 0n)]],
    ["unknown account", [dr("9999", 100n), cr(A.SHARE_CAPITAL, 100n)]],
    ["negative amount", [dr(A.BANK, -100n), cr(A.SHARE_CAPITAL, -100n)]],
    ["both sides on one line", [{ account: A.BANK, debit: 100n, credit: 100n }, dr(A.RENT, 100n), cr(A.SHARE_CAPITAL, 100n)]],
  ])("rejects %s", (_name, lines) => {
    const l = new Ledger();
    expect(() => l.post(entry(lines))).toThrow(LedgerError);
    expect(l.all()).toHaveLength(0);
  });

  it("rejects invalid dates", () => {
    const l = new Ledger();
    expect(() => l.post(entry([dr(A.BANK, 1n), cr(A.SHARE_CAPITAL, 1n)], "13/11/2026"))).toThrow(LedgerError);
  });

  it("freezes posted entries so they cannot be edited", () => {
    const l = new Ledger();
    const e = l.post(entry([dr(A.BANK, 100n), cr(A.SHARE_CAPITAL, 100n)]));
    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.lines)).toBe(true);
    expect(Object.isFrozen(e.lines[0])).toBe(true);
  });

  it("corrects by reversal, and only once", () => {
    const l = new Ledger();
    const e = l.post(entry([dr(A.RENT, 500n), cr(A.BANK, 500n)]));
    const r = l.reverse(e.id, "2026-11-14");
    expect(r.reversalOf).toBe(e.id);
    expect(l.debitBalance(A.RENT)).toBe(0n);
    expect(l.debitBalance(A.BANK)).toBe(0n);
    expect(() => l.reverse(e.id, "2026-11-15")).toThrow(LedgerError);
  });

  it("respects as-at dates when computing balances", () => {
    const l = new Ledger();
    l.post(entry([dr(A.BANK, 100n), cr(A.SHARE_CAPITAL, 100n)], "2026-11-13"));
    l.post(entry([dr(A.RENT, 40n), cr(A.BANK, 40n)], "2026-12-01"));
    expect(l.debitBalance(A.BANK, "2026-11-30")).toBe(100n);
    expect(l.debitBalance(A.BANK, "2026-12-01")).toBe(60n);
  });
});
