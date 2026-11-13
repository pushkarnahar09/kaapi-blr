/**
 * Cash items: dated, signed cash movements used by the forecast.
 * The cash effect of a business event is read from its own posting rule, so a forecast item
 * and the actual posting can never disagree about how much cash moves.
 */
import type { ScheduledItem } from "@vfs/engine-core";
import { CASH_ACCOUNTS, toJournal, type BusinessEvent, type Paise, type SimDate } from "@vfs/ledger";

export type CashSection = "receipts" | "payments" | "investing" | "financing";

export interface CashItem {
  readonly id: string;
  readonly date: SimDate;
  readonly category: string;
  readonly section: CashSection;
  /** Positive = cash in, negative = cash out. */
  readonly amount: Paise;
  readonly label: string;
  /** "scheduled" = already committed in the books; "forecast" = an estimate from the driver model. */
  readonly basis: "scheduled" | "forecast";
}

const cash = new Set<string>(CASH_ACCOUNTS);

export function cashEffect(event: BusinessEvent): Paise {
  let total = 0n;
  for (const l of toJournal(event).lines) if (cash.has(l.account)) total += l.debit - l.credit;
  return total;
}

/** Category and section for each event type, matching the 13-week layout in doc 10. */
export function categorise(event: BusinessEvent): { category: string; section: CashSection } {
  switch (event.type) {
    case "SaleRecorded":
      return { category: "Cash sales", section: "receipts" };
    case "PaymentSettled":
      return { category: "UPI/card settlements", section: "receipts" };
    case "AggregatorPayout":
      return { category: "Aggregator payouts", section: "receipts" };
    case "VendorPaid":
    case "StockPurchased":
      return { category: "Supplier payments", section: "payments" };
    case "SalariesPaid":
      return { category: "Payroll", section: "payments" };
    case "StatutoryPaid":
      return { category: "Statutory dues (TDS, PF, PT)", section: "payments" };
    case "RentPaid":
      return { category: "Rent", section: "payments" };
    case "MarketingSpent":
      return { category: "Marketing", section: "payments" };
    case "AssetPurchased":
      return { category: "Capex", section: "investing" };
    case "DepositPaid":
      return { category: "Deposits", section: "investing" };
    case "EquityIssued":
      return { category: "Equity received", section: "financing" };
    case "LoanDrawn":
      return { category: "Loan drawdown", section: "financing" };
    case "LoanRepaid":
      return { category: "Debt service", section: "financing" };
    default:
      return { category: "Other", section: "payments" };
  }
}

/** Turn an event into a cash item, or null if it moves no cash. */
export function itemFromEvent(id: string, event: BusinessEvent, label: string, basis: CashItem["basis"]): CashItem | null {
  const amount = cashEffect(event);
  if (amount === 0n) return null;
  return { id, date: event.date, amount, label, basis, ...categorise(event) };
}

/** Committed future cash from the simulation's schedule. */
export function itemsFromSchedule(pending: readonly ScheduledItem[]): CashItem[] {
  const out: CashItem[] = [];
  for (const s of pending) {
    const item = itemFromEvent(`S${s.id}`, s.event, s.label, "scheduled");
    if (item) out.push(item);
  }
  return out;
}

/** GST payments are computed rather than evented, so they get their own constructor. */
export function gstItem(id: string, date: SimDate, amount: Paise, label: string, basis: CashItem["basis"]): CashItem {
  return { id, date, amount: -amount, label, basis, category: "GST", section: "payments" };
}
