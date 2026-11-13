/**
 * Property tests (doc 19, section 2): whatever sequence of business events happens,
 * the books must reconcile. fast-check generates thousands of random event sequences.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ACCOUNTS as A } from "../src/accounts.js";
import { Ledger } from "../src/journal.js";
import { gstSettlement, intraStateGst, toJournal, type BusinessEvent } from "../src/posting.js";
import { balanceSheet, cashBalance, cashBridge, trialBalance } from "../src/statements.js";

const amount = fc.bigInt({ min: 0n, max: 50_00_000_00n }); // up to ₹50 lakh
const rate = fc.constantFrom(0, 500, 1200, 1800, 4000);
const smallRate = fc.constantFrom(0, 10, 100, 200, 1000);
const day = fc.integer({ min: 1, max: 28 }).map((d) => `2027-01-${String(d).padStart(2, "0")}`);
const bool = fc.boolean();

const event: fc.Arbitrary<BusinessEvent> = fc.oneof(
  fc.record({ type: fc.constant("EquityIssued" as const), date: day, faceValue: amount, premium: amount }),
  fc.record({ type: fc.constant("LoanDrawn" as const), date: day, amount }),
  fc.record({ type: fc.constant("LoanRepaid" as const), date: day, principal: amount, interest: amount }),
  fc.record({ type: fc.constant("DepositPaid" as const), date: day, amount }),
  fc.record({
    type: fc.constant("AssetPurchased" as const), date: day,
    assetAccount: fc.constantFrom(A.KITCHEN_EQUIPMENT, A.FURNITURE_FITOUT, A.COMPUTERS),
    cost: amount, gstRateBp: rate, itcAllowed: bool, onCredit: bool, msmeVendor: bool,
  }),
  fc.record({
    type: fc.constant("SaleRecorded" as const), date: day, channel: fc.constantFrom("dine_in" as const, "retail" as const),
    taxable: amount, gstRateBp: rate, method: fc.constantFrom("cash" as const, "upi" as const, "card" as const),
  }),
  fc
    .record({ type: fc.constant("PaymentSettled" as const), date: day, gross: amount, fee: amount, feeGstRateBp: rate, itcAllowed: bool })
    // A settlement cannot pay out less than zero.
    .filter((s) => s.gross >= s.fee + intraStateGst(s.fee, s.feeGstRateBp).total),
  fc.record({ type: fc.constant("AggregatorOrder" as const), date: day, foodValue: amount }),
  fc.record({
    type: fc.constant("AggregatorStatement" as const), date: day, commission: amount,
    commissionGstRateBp: rate, itcAllowed: bool, tdsRateBp: smallRate, tdsBase: amount,
  }),
  fc.record({ type: fc.constant("AggregatorPayout" as const), date: day, amount }),
  fc.record({ type: fc.constant("StockPurchased" as const), date: day, taxable: amount, gstRateBp: rate, itcAllowed: bool, msmeVendor: bool }),
  fc.record({ type: fc.constant("MaterialsConsumed" as const), date: day, cost: amount }),
  fc.record({ type: fc.constant("WastageRecorded" as const), date: day, cost: amount }),
  fc.record({ type: fc.constant("VendorPaid" as const), date: day, amount, msmeVendor: bool }),
  fc.record({ type: fc.constant("RentInvoiced" as const), date: day, rent: amount, gstRateBp: rate, itcAllowed: bool, tdsRateBp: smallRate }),
  fc.record({ type: fc.constant("RentPaid" as const), date: day, amount }),
  fc
    .record({ gross: amount, employeePf: amount, employerPf: amount, professionalTax: amount, tds: amount, date: day })
    // Deductions can never exceed gross pay.
    .filter((p) => p.employeePf + p.professionalTax + p.tds <= p.gross)
    .map((p) => ({ type: "PayrollAccrued" as const, ...p })),
  fc.record({ type: fc.constant("SalariesPaid" as const), date: day, amount }),
  fc.record({
    type: fc.constant("StatutoryPaid" as const), date: day,
    liability: fc.constantFrom(A.TDS_PAYABLE, A.PROFESSIONAL_TAX_PAYABLE, A.PF_PAYABLE, A.ESI_PAYABLE),
    amount, interest: amount,
  }),
  fc.record({ type: fc.constant("MarketingSpent" as const), date: day, amount, gstRateBp: rate, itcAllowed: bool }),
  fc.record({ type: fc.constant("DepreciationCharged" as const), date: day, amount }),
);

/** Post whatever is postable; events whose amounts are all zero are legitimately rejected. */
function postAll(events: BusinessEvent[]): Ledger {
  const ledger = new Ledger();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    const draft = toJournal(e);
    const nonZero = draft.lines.filter((l) => l.debit !== 0n || l.credit !== 0n).length;
    if (nonZero < 2) continue;
    ledger.post(draft);
  }
  return ledger;
}

const RUNS = Number(process.env.PROPERTY_RUNS ?? 1000);

describe("accounting invariants under random event sequences", () => {
  it("trial balance always nets to zero and the balance sheet always balances", () => {
    fc.assert(
      fc.property(fc.array(event, { maxLength: 60 }), (events) => {
        const ledger = postAll(events);
        for (const asAt of ["2027-01-10", "2027-01-20", "2027-01-31"]) {
          const tb = trialBalance(ledger, asAt);
          expect(tb.totalDebit).toBe(tb.totalCredit);
          expect(balanceSheet(ledger, asAt).difference).toBe(0n);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it("the cash bridge always reconciles opening to closing cash", () => {
    fc.assert(
      fc.property(fc.array(event, { maxLength: 60 }), (events) => {
        const ledger = postAll(events);
        const bridge = cashBridge(ledger, "2027-01-08", "2027-01-31");
        expect(bridge.opening).toBe(cashBalance(ledger, "2027-01-07"));
        expect(bridge.closing).toBe(cashBalance(ledger, "2027-01-31"));
      }),
      { numRuns: RUNS },
    );
  });

  it("reversing every entry returns every account to zero", () => {
    fc.assert(
      fc.property(fc.array(event, { maxLength: 40 }), (events) => {
        const ledger = postAll(events);
        for (const e of [...ledger.all()]) ledger.reverse(e.id, "2027-02-01");
        for (const code of ledger.accounts.keys()) expect(ledger.debitBalance(code)).toBe(0n);
      }),
      { numRuns: Math.max(100, RUNS / 5) },
    );
  });

  it("GST settlement clears output tax, never over-uses credit, and keeps the books balanced", () => {
    fc.assert(
      fc.property(fc.array(event, { maxLength: 60 }), (events) => {
        const ledger = postAll(events);
        const before = { cgst: ledger.debitBalance(A.INPUT_CGST), sgst: ledger.debitBalance(A.INPUT_SGST) };
        const draft = gstSettlement(ledger, "2027-02-20");
        if (draft) ledger.post(draft);
        for (const out of [A.OUTPUT_CGST, A.OUTPUT_SGST]) expect(ledger.debitBalance(out) >= 0n).toBe(true);
        // Remaining credit is never negative unless it started negative.
        if (before.cgst >= 0n) expect(ledger.debitBalance(A.INPUT_CGST) >= 0n).toBe(true);
        if (before.sgst >= 0n) expect(ledger.debitBalance(A.INPUT_SGST) >= 0n).toBe(true);
        expect(balanceSheet(ledger, "2027-02-28").difference).toBe(0n);
      }),
      { numRuns: RUNS },
    );
  });
});
