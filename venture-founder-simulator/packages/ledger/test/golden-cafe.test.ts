/**
 * Golden scenario G1/G2 (doc 19): cafe formation, pre-opening and first week of trade.
 * Every expected figure below was worked out by hand, not by the code under test.
 * Tax rates are ILLUSTRATIVE MODEL ASSUMPTIONS for testing the mechanics only:
 *   restaurant sales 5% without ITC, equipment/rent/commission GST 18% (not creditable),
 *   ingredients GST 5% (not creditable), TDS on rent 10%, operator TDS 0.1%.
 */
import { describe, expect, it } from "vitest";
import { ACCOUNTS as A } from "../src/accounts.js";
import { Ledger } from "../src/journal.js";
import { rupees as r } from "../src/money.js";
import { gstSettlement, toJournal, type BusinessEvent } from "../src/posting.js";
import { balanceSheet, cashBalance, cashBridge, incomeStatement, trialBalance } from "../src/statements.js";

const events: BusinessEvent[] = [
  { type: "EquityIssued", date: "2026-11-13", faceValue: r("100000"), premium: r("900000") },
  { type: "DepositPaid", date: "2026-11-14", amount: r("450000") },
  {
    type: "AssetPurchased", date: "2026-11-16", assetAccount: A.KITCHEN_EQUIPMENT,
    cost: r("300000"), gstRateBp: 1800, itcAllowed: false, onCredit: false,
  },
  { type: "RentInvoiced", date: "2026-12-01", rent: r("150000"), gstRateBp: 1800, itcAllowed: false, tdsRateBp: 1000 },
  { type: "RentPaid", date: "2026-12-01", amount: r("162000") },
  { type: "SaleRecorded", date: "2026-12-02", channel: "dine_in", taxable: r("1000"), gstRateBp: 500, method: "upi" },
  { type: "AggregatorOrder", date: "2026-12-02", foodValue: r("1000") },
  { type: "PaymentSettled", date: "2026-12-03", gross: r("1050"), fee: 0n, feeGstRateBp: 1800, itcAllowed: false },
  { type: "StockPurchased", date: "2026-12-05", taxable: r("10000"), gstRateBp: 500, itcAllowed: false },
  { type: "MaterialsConsumed", date: "2026-12-06", cost: r("4200") },
  { type: "WastageRecorded", date: "2026-12-06", cost: r("300") },
  {
    type: "AggregatorStatement", date: "2026-12-07", commission: r("250"),
    commissionGstRateBp: 1800, itcAllowed: false, tdsRateBp: 10, tdsBase: r("1000"),
  },
  { type: "StatutoryPaid", date: "2026-12-07", liability: A.TDS_PAYABLE, amount: r("15000"), interest: 0n },
  { type: "AggregatorPayout", date: "2026-12-09", amount: r("704") },
];

function build(): Ledger {
  const ledger = new Ledger();
  for (const e of events) ledger.post(toJournal(e));
  return ledger;
}

describe("golden cafe scenario", () => {
  const ledger = build();

  it("capitalises GST on equipment when credit is not available", () => {
    expect(ledger.debitBalance(A.KITCHEN_EQUIPMENT)).toBe(r("354000"));
  });

  it("treats the deposit as an asset, not an expense", () => {
    expect(ledger.debitBalance(A.SECURITY_DEPOSITS)).toBe(r("450000"));
    expect(incomeStatement(ledger, "2026-11-01", "2026-11-30").totalExpenses).toBe(0n);
  });

  it("nets the aggregator receivable to zero: ₹1,000 sale became ₹704 cash", () => {
    expect(ledger.debitBalance(A.AGGREGATOR_RECEIVABLE)).toBe(0n);
    expect(ledger.debitBalance(A.TDS_RECEIVABLE)).toBe(r("1"));
    expect(ledger.debitBalance(A.NON_CREDITABLE_GST, "2026-12-09", "2026-12-07")).toBe(r("45"));
  });

  it("produces the hand-calculated cash balance", () => {
    // 10,00,000 - 4,50,000 - 3,54,000 - 1,62,000 + 1,050 + 704 - 15,000
    expect(cashBalance(ledger, "2026-12-09")).toBe(r("20754"));
  });

  it("produces the hand-calculated P&L for 1 to 9 December", () => {
    const pl = incomeStatement(ledger, "2026-12-01", "2026-12-09");
    expect(pl.totalRevenue).toBe(r("2000"));
    // rent 1,50,000 + GST not creditable 27,045 + commission 250 + materials 4,200 + wastage 300
    expect(pl.totalExpenses).toBe(r("181795"));
    expect(pl.profit).toBe(r("-179795"));
  });

  it("produces a balancing balance sheet with hand-calculated totals", () => {
    const bs = balanceSheet(ledger, "2026-12-09");
    expect(bs.totalAssets).toBe(r("830755"));
    expect(bs.totalLiabilities).toBe(r("10550"));
    expect(bs.totalEquity).toBe(r("820205"));
    expect(bs.difference).toBe(0n);
  });

  it("has a trial balance that nets to zero", () => {
    const tb = trialBalance(ledger, "2026-12-09");
    expect(tb.totalDebit).toBe(tb.totalCredit);
  });

  it("reconciles the cash bridge from opening to closing cash", () => {
    const bridge = cashBridge(ledger, "2026-12-01", "2026-12-09");
    expect(bridge.opening).toBe(r("196000"));
    expect(bridge.closing).toBe(r("20754"));
    expect(bridge.lines.find((l) => l.source === "RentPaid")?.amount).toBe(r("-162000"));
  });

  it("settles GST: no input credit, so the full ₹50 output tax is paid in cash", () => {
    const l = build();
    const draft = gstSettlement(l, "2026-12-20");
    expect(draft).not.toBeNull();
    l.post(draft!);
    expect(l.debitBalance(A.OUTPUT_CGST)).toBe(0n);
    expect(l.debitBalance(A.OUTPUT_SGST)).toBe(0n);
    expect(cashBalance(l, "2026-12-20")).toBe(r("20704"));
  });

  it("uses input credit before cash when credit is available", () => {
    const l = new Ledger();
    l.post(toJournal({ type: "EquityIssued", date: "2026-11-13", faceValue: r("10000"), premium: 0n }));
    l.post(toJournal({ type: "SaleRecorded", date: "2026-11-20", channel: "retail", taxable: r("10000"), gstRateBp: 1800, method: "cash" }));
    l.post(toJournal({ type: "MarketingSpent", date: "2026-11-21", amount: r("2000"), gstRateBp: 1800, itcAllowed: true }));
    // Output 900 + 900; input 180 + 180; cash payable 720 + 720
    l.post(gstSettlement(l, "2026-11-30")!);
    expect(l.debitBalance(A.INPUT_CGST)).toBe(0n);
    expect(cashBalance(l, "2026-11-30")).toBe(r("10000") + r("11800") - r("2360") - r("1440"));
  });
});
