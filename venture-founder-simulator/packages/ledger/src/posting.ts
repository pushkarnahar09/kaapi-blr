/**
 * Posting rules: business events in, balanced journal drafts out (blueprint doc 09, section 3).
 *
 * Tax rates are INPUTS here, never constants. The tax rule tables (package tax-in, later)
 * resolve the correct rate, ITC eligibility and TDS rate for a date and pass them in.
 * All supplies are treated as intra-state (CGST + SGST) for now; IGST comes with tax-in.
 */
import { ACCOUNTS as A } from "./accounts.js";
import { cr, dr, type JournalDraft, type JournalLine, type Ledger, type SimDate } from "./journal.js";
import { applyRate, type BasisPoints, type Paise } from "./money.js";

export interface GstSplit {
  readonly cgst: Paise;
  readonly sgst: Paise;
  readonly total: Paise;
}

/** Each half is computed on the taxable value and rounded separately. */
export function intraStateGst(taxable: Paise, rateBp: BasisPoints): GstSplit {
  if (rateBp % 2 !== 0) throw new Error(`GST rate ${rateBp} bp cannot be split evenly into CGST and SGST`);
  const cgst = applyRate(taxable, rateBp / 2);
  const sgst = applyRate(taxable, rateBp / 2);
  return { cgst, sgst, total: cgst + sgst };
}

/** Input GST lines: claimable credit, or a cost charged to `costAccount` when credit is not available. */
function inputGstLines(gst: GstSplit, itcAllowed: boolean, costAccount: string): JournalLine[] {
  if (itcAllowed) return [dr(A.INPUT_CGST, gst.cgst), dr(A.INPUT_SGST, gst.sgst)];
  return [dr(costAccount, gst.total)];
}

export type PaymentMethod = "cash" | "upi" | "card";

export type BusinessEvent =
  | { type: "EquityIssued"; date: SimDate; faceValue: Paise; premium: Paise }
  | { type: "LoanDrawn"; date: SimDate; amount: Paise }
  | { type: "LoanRepaid"; date: SimDate; principal: Paise; interest: Paise }
  | { type: "DepositPaid"; date: SimDate; amount: Paise }
  | {
      type: "AssetPurchased";
      date: SimDate;
      assetAccount: string;
      cost: Paise;
      gstRateBp: BasisPoints;
      itcAllowed: boolean;
      onCredit: boolean;
      msmeVendor?: boolean;
    }
  | {
      type: "SaleRecorded";
      date: SimDate;
      channel: "dine_in" | "retail";
      taxable: Paise;
      gstRateBp: BasisPoints;
      method: PaymentMethod;
    }
  | { type: "PaymentSettled"; date: SimDate; gross: Paise; fee: Paise; feeGstRateBp: BasisPoints; itcAllowed: boolean }
  | { type: "AggregatorOrder"; date: SimDate; foodValue: Paise }
  | {
      type: "AggregatorStatement";
      date: SimDate;
      commission: Paise;
      commissionGstRateBp: BasisPoints;
      itcAllowed: boolean;
      tdsRateBp: BasisPoints;
      /** Taxable value on which the operator deducts TDS. */
      tdsBase: Paise;
    }
  | { type: "AggregatorPayout"; date: SimDate; amount: Paise }
  | { type: "StockPurchased"; date: SimDate; taxable: Paise; gstRateBp: BasisPoints; itcAllowed: boolean; msmeVendor?: boolean }
  | { type: "MaterialsConsumed"; date: SimDate; cost: Paise }
  | { type: "WastageRecorded"; date: SimDate; cost: Paise }
  | { type: "VendorPaid"; date: SimDate; amount: Paise; msmeVendor?: boolean }
  | { type: "RentInvoiced"; date: SimDate; rent: Paise; gstRateBp: BasisPoints; itcAllowed: boolean; tdsRateBp: BasisPoints }
  | { type: "RentPaid"; date: SimDate; amount: Paise }
  | {
      type: "PayrollAccrued";
      date: SimDate;
      gross: Paise;
      employeePf: Paise;
      employerPf: Paise;
      professionalTax: Paise;
      tds: Paise;
    }
  | { type: "SalariesPaid"; date: SimDate; amount: Paise }
  | {
      type: "StatutoryPaid";
      date: SimDate;
      liability: typeof A.TDS_PAYABLE | typeof A.PROFESSIONAL_TAX_PAYABLE | typeof A.PF_PAYABLE | typeof A.ESI_PAYABLE;
      amount: Paise;
      interest: Paise;
    }
  | { type: "MarketingSpent"; date: SimDate; amount: Paise; gstRateBp: BasisPoints; itcAllowed: boolean }
  | { type: "DepreciationCharged"; date: SimDate; amount: Paise };

const SALES_ACCOUNT = { dine_in: A.SALES_DINE_IN, retail: A.SALES_RETAIL } as const;

/** Where a customer payment lands on the sale date. Cash is in hand; UPI and card settle later. */
const RECEIPT_ACCOUNT: Record<PaymentMethod, string> = {
  cash: A.PETTY_CASH,
  upi: A.PAYMENT_SETTLEMENT_RECEIVABLE,
  card: A.PAYMENT_SETTLEMENT_RECEIVABLE,
};

export function toJournal(e: BusinessEvent): JournalDraft {
  const base = { date: e.date, source: e.type };
  switch (e.type) {
    case "EquityIssued":
      return {
        ...base,
        memo: "Shares issued for cash",
        lines: [dr(A.BANK, e.faceValue + e.premium), cr(A.SHARE_CAPITAL, e.faceValue), cr(A.SECURITIES_PREMIUM, e.premium)],
      };
    case "LoanDrawn":
      return { ...base, memo: "Term loan drawn", lines: [dr(A.BANK, e.amount), cr(A.TERM_LOAN, e.amount)] };
    case "LoanRepaid":
      return {
        ...base,
        memo: "Loan instalment",
        lines: [dr(A.TERM_LOAN, e.principal), dr(A.INTEREST_ON_LOANS, e.interest), cr(A.BANK, e.principal + e.interest)],
      };
    case "DepositPaid":
      return { ...base, memo: "Security deposit paid (an asset, not an expense)", lines: [dr(A.SECURITY_DEPOSITS, e.amount), cr(A.BANK, e.amount)] };
    case "AssetPurchased": {
      const gst = intraStateGst(e.cost, e.gstRateBp);
      // Without ITC, the GST becomes part of the asset's cost.
      const lines = e.itcAllowed
        ? [dr(e.assetAccount, e.cost), dr(A.INPUT_CGST, gst.cgst), dr(A.INPUT_SGST, gst.sgst)]
        : [dr(e.assetAccount, e.cost + gst.total)];
      const creditAccount = !e.onCredit ? A.BANK : e.msmeVendor ? A.VENDORS_MSME : A.VENDORS;
      return { ...base, memo: "Capital asset purchased", lines: [...lines, cr(creditAccount, e.cost + gst.total)] };
    }
    case "SaleRecorded": {
      const gst = intraStateGst(e.taxable, e.gstRateBp);
      return {
        ...base,
        memo: `Sale (${e.channel}, ${e.method})`,
        lines: [
          dr(RECEIPT_ACCOUNT[e.method], e.taxable + gst.total),
          cr(SALES_ACCOUNT[e.channel], e.taxable),
          cr(A.OUTPUT_CGST, gst.cgst),
          cr(A.OUTPUT_SGST, gst.sgst),
        ],
      };
    }
    case "PaymentSettled": {
      const gst = intraStateGst(e.fee, e.feeGstRateBp);
      return {
        ...base,
        memo: "UPI/card settlement received",
        lines: [
          dr(A.BANK, e.gross - e.fee - gst.total),
          dr(A.PAYMENT_FEES, e.fee),
          ...inputGstLines(gst, e.itcAllowed, A.NON_CREDITABLE_GST),
          cr(A.PAYMENT_SETTLEMENT_RECEIVABLE, e.gross),
        ],
      };
    }
    case "AggregatorOrder":
      // The operator collects and pays GST on these supplies, so no output GST is booked here
      // (treatment to be confirmed against current CBIC position by the tax rule tables).
      return { ...base, memo: "Delivery order via aggregator", lines: [dr(A.AGGREGATOR_RECEIVABLE, e.foodValue), cr(A.SALES_DELIVERY, e.foodValue)] };
    case "AggregatorStatement": {
      const gst = intraStateGst(e.commission, e.commissionGstRateBp);
      const tds = applyRate(e.tdsBase, e.tdsRateBp);
      return {
        ...base,
        memo: "Aggregator commission, GST on commission and TDS deducted",
        lines: [
          dr(A.AGGREGATOR_COMMISSION, e.commission),
          ...inputGstLines(gst, e.itcAllowed, A.NON_CREDITABLE_GST),
          dr(A.TDS_RECEIVABLE, tds),
          cr(A.AGGREGATOR_RECEIVABLE, e.commission + gst.total + tds),
        ],
      };
    }
    case "AggregatorPayout":
      return { ...base, memo: "Aggregator payout received", lines: [dr(A.BANK, e.amount), cr(A.AGGREGATOR_RECEIVABLE, e.amount)] };
    case "StockPurchased": {
      const gst = intraStateGst(e.taxable, e.gstRateBp);
      return {
        ...base,
        memo: "Ingredients purchased on credit",
        lines: [
          dr(A.RAW_MATERIALS, e.taxable),
          ...inputGstLines(gst, e.itcAllowed, A.RAW_MATERIALS),
          cr(e.msmeVendor ? A.VENDORS_MSME : A.VENDORS, e.taxable + gst.total),
        ],
      };
    }
    case "MaterialsConsumed":
      return { ...base, memo: "Materials consumed", lines: [dr(A.MATERIALS_CONSUMED, e.cost), cr(A.RAW_MATERIALS, e.cost)] };
    case "WastageRecorded":
      return { ...base, memo: "Wastage written off", lines: [dr(A.WASTAGE, e.cost), cr(A.RAW_MATERIALS, e.cost)] };
    case "VendorPaid": {
      const account = e.msmeVendor ? A.VENDORS_MSME : A.VENDORS;
      return { ...base, memo: "Vendor payment", lines: [dr(account, e.amount), cr(A.BANK, e.amount)] };
    }
    case "RentInvoiced": {
      const gst = intraStateGst(e.rent, e.gstRateBp);
      // TDS is computed on rent excluding GST (to be confirmed by tax-in rule tables).
      const tds = applyRate(e.rent, e.tdsRateBp);
      return {
        ...base,
        memo: "Monthly rent invoice",
        lines: [
          dr(A.RENT, e.rent),
          ...inputGstLines(gst, e.itcAllowed, A.NON_CREDITABLE_GST),
          cr(A.RENT_PAYABLE, e.rent + gst.total - tds),
          cr(A.TDS_PAYABLE, tds),
        ],
      };
    }
    case "RentPaid":
      return { ...base, memo: "Rent paid", lines: [dr(A.RENT_PAYABLE, e.amount), cr(A.BANK, e.amount)] };
    case "PayrollAccrued": {
      const net = e.gross - e.employeePf - e.professionalTax - e.tds;
      return {
        ...base,
        memo: "Monthly payroll",
        lines: [
          dr(A.SALARIES, e.gross),
          dr(A.EMPLOYER_STATUTORY, e.employerPf),
          cr(A.SALARIES_PAYABLE, net),
          cr(A.PF_PAYABLE, e.employeePf + e.employerPf),
          cr(A.PROFESSIONAL_TAX_PAYABLE, e.professionalTax),
          cr(A.TDS_PAYABLE, e.tds),
        ],
      };
    }
    case "SalariesPaid":
      return { ...base, memo: "Net salaries paid", lines: [dr(A.SALARIES_PAYABLE, e.amount), cr(A.BANK, e.amount)] };
    case "StatutoryPaid":
      return {
        ...base,
        memo: "Statutory dues deposited",
        lines: [dr(e.liability, e.amount), dr(A.INTEREST_PENALTY_STATUTORY, e.interest), cr(A.BANK, e.amount + e.interest)],
      };
    case "MarketingSpent": {
      const gst = intraStateGst(e.amount, e.gstRateBp);
      return {
        ...base,
        memo: "Marketing spend",
        lines: [dr(A.MARKETING, e.amount), ...inputGstLines(gst, e.itcAllowed, A.NON_CREDITABLE_GST), cr(A.BANK, e.amount + gst.total)],
      };
    }
    case "DepreciationCharged":
      return { ...base, memo: "Depreciation", lines: [dr(A.DEPRECIATION, e.amount), cr(A.ACCUMULATED_DEPRECIATION, e.amount)] };
  }
}

/**
 * Month-end GST: use input credit against output liability head by head, pay the rest from bank.
 * Unused credit carries forward. Cross-utilisation rules (IGST order etc.) arrive with tax-in.
 */
export function gstSettlement(ledger: Ledger, date: SimDate, lateInterest: Paise = 0n): JournalDraft | null {
  const heads = [
    { input: A.INPUT_CGST, output: A.OUTPUT_CGST },
    { input: A.INPUT_SGST, output: A.OUTPUT_SGST },
  ];
  const lines: JournalLine[] = [];
  let cash = 0n;
  for (const h of heads) {
    const credit = ledger.debitBalance(h.input, date); // asset: debit positive
    const liability = -ledger.debitBalance(h.output, date); // liability: credit positive
    if (liability <= 0n) continue;
    const used = credit > 0n ? (credit < liability ? credit : liability) : 0n;
    lines.push(dr(h.output, liability));
    if (used > 0n) lines.push(cr(h.input, used));
    cash += liability - used;
  }
  if (lines.length === 0) return null;
  if (lateInterest > 0n) lines.push(dr(A.INTEREST_PENALTY_STATUTORY, lateInterest));
  if (cash + lateInterest > 0n) lines.push(cr(A.BANK, cash + lateInterest));
  return { date, source: "GstSettled", memo: "GST liability settled (credit used, balance paid)", lines };
}
