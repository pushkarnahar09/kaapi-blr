/**
 * Financial statements derived only from the ledger (blueprint doc 09, section 4).
 */
import { CASH_ACCOUNTS, isDebitNormal, type AccountClass } from "./accounts.js";
import type { Ledger, SimDate } from "./journal.js";
import type { Paise } from "./money.js";

export interface StatementLine {
  readonly code: string;
  readonly name: string;
  /** Balance shown in the account's natural direction (positive = normal balance). */
  readonly amount: Paise;
}

export interface TrialBalance {
  readonly asAt: SimDate;
  readonly rows: readonly { code: string; name: string; debit: Paise; credit: Paise }[];
  readonly totalDebit: Paise;
  readonly totalCredit: Paise;
}

export function trialBalance(ledger: Ledger, asAt: SimDate): TrialBalance {
  const rows = [];
  let totalDebit = 0n;
  let totalCredit = 0n;
  for (const a of ledger.accounts.values()) {
    const bal = ledger.debitBalance(a.code, asAt);
    if (bal === 0n) continue;
    const debit = bal > 0n ? bal : 0n;
    const credit = bal < 0n ? -bal : 0n;
    rows.push({ code: a.code, name: a.name, debit, credit });
    totalDebit += debit;
    totalCredit += credit;
  }
  return { asAt, rows, totalDebit, totalCredit };
}

function linesFor(ledger: Ledger, cls: AccountClass, asAt: SimDate, from?: SimDate): StatementLine[] {
  const out: StatementLine[] = [];
  for (const a of ledger.accounts.values()) {
    if (a.class !== cls) continue;
    const debitBal = ledger.debitBalance(a.code, asAt, from);
    if (debitBal === 0n) continue;
    // Show in the class's natural direction; contra accounts therefore appear negative.
    const classDebitNormal = cls === "asset" || cls === "expense";
    out.push({ code: a.code, name: a.name, amount: classDebitNormal ? debitBal : -debitBal });
  }
  return out;
}

const sum = (lines: readonly StatementLine[]): Paise => lines.reduce((t, l) => t + l.amount, 0n);

export interface IncomeStatement {
  readonly from: SimDate;
  readonly to: SimDate;
  readonly revenue: readonly StatementLine[];
  readonly expenses: readonly StatementLine[];
  readonly totalRevenue: Paise;
  readonly totalExpenses: Paise;
  readonly profit: Paise;
}

export function incomeStatement(ledger: Ledger, from: SimDate, to: SimDate): IncomeStatement {
  const revenue = linesFor(ledger, "revenue", to, from);
  const expenses = linesFor(ledger, "expense", to, from);
  const totalRevenue = sum(revenue);
  const totalExpenses = sum(expenses);
  return { from, to, revenue, expenses, totalRevenue, totalExpenses, profit: totalRevenue - totalExpenses };
}

export interface BalanceSheet {
  readonly asAt: SimDate;
  readonly assets: readonly StatementLine[];
  readonly liabilities: readonly StatementLine[];
  readonly equity: readonly StatementLine[];
  /** Cumulative profit not yet closed to retained earnings. */
  readonly unclosedProfit: Paise;
  readonly totalAssets: Paise;
  readonly totalLiabilities: Paise;
  readonly totalEquity: Paise;
  /** totalAssets - (totalLiabilities + totalEquity). Must always be 0. */
  readonly difference: Paise;
}

export function balanceSheet(ledger: Ledger, asAt: SimDate): BalanceSheet {
  const assets = linesFor(ledger, "asset", asAt);
  const liabilities = linesFor(ledger, "liability", asAt);
  const equity = linesFor(ledger, "equity", asAt);
  const unclosedProfit = sum(linesFor(ledger, "revenue", asAt)) - sum(linesFor(ledger, "expense", asAt));
  const totalAssets = sum(assets);
  const totalLiabilities = sum(liabilities);
  const totalEquity = sum(equity) + unclosedProfit;
  return {
    asAt,
    assets,
    liabilities,
    equity,
    unclosedProfit,
    totalAssets,
    totalLiabilities,
    totalEquity,
    difference: totalAssets - totalLiabilities - totalEquity,
  };
}

/** Cash on hand and at bank as at a date. */
export function cashBalance(ledger: Ledger, asAt: SimDate): Paise {
  return CASH_ACCOUNTS.reduce((t, code) => t + ledger.debitBalance(code, asAt), 0n);
}

export interface CashBridgeLine {
  readonly source: string;
  readonly amount: Paise;
}

/**
 * Direct-method cash bridge: opening cash + movements grouped by business event = closing cash.
 * Matches the brief's cash bridge (doc 10) at its simplest.
 */
export function cashBridge(ledger: Ledger, from: SimDate, to: SimDate) {
  const cash = new Set<string>(CASH_ACCOUNTS);
  const dayBefore = new Date(Date.parse(from) - 86_400_000).toISOString().slice(0, 10);
  const opening = cashBalance(ledger, dayBefore);
  const bySource = new Map<string, Paise>();
  for (const e of ledger.between(from, to)) {
    let move = 0n;
    for (const l of e.lines) if (cash.has(l.account)) move += l.debit - l.credit;
    if (move !== 0n) bySource.set(e.source, (bySource.get(e.source) ?? 0n) + move);
  }
  const lines: CashBridgeLine[] = [...bySource].map(([source, amount]) => ({ source, amount }));
  const closing = opening + lines.reduce((t, l) => t + l.amount, 0n);
  return { from, to, opening, lines, closing };
}

/** True if every account's balance sits on its normal side or is zero. Useful for spotting oddities. */
export function abnormalBalances(ledger: Ledger, asAt: SimDate): string[] {
  const out: string[] = [];
  for (const a of ledger.accounts.values()) {
    const bal = ledger.debitBalance(a.code, asAt);
    if (bal === 0n) continue;
    if (isDebitNormal(a) ? bal < 0n : bal > 0n) out.push(a.code);
  }
  return out;
}
