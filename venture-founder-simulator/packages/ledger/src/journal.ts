import { CHART_OF_ACCOUNTS, type Account } from "./accounts.js";
import type { Paise } from "./money.js";

/** Business date in the simulation, ISO "YYYY-MM-DD". Never a timestamp. */
export type SimDate = string;

export interface JournalLine {
  readonly account: string;
  readonly debit: Paise;
  readonly credit: Paise;
}

export interface JournalDraft {
  readonly date: SimDate;
  readonly memo: string;
  /** Business event type that produced this entry, e.g. "SaleRecorded". */
  readonly source: string;
  readonly lines: readonly JournalLine[];
}

export interface JournalEntry extends JournalDraft {
  readonly id: number;
  readonly reversalOf?: number;
}

export class LedgerError extends Error {
  override name = "LedgerError";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dr(account: string, amount: Paise): JournalLine {
  return { account, debit: amount, credit: 0n };
}
export function cr(account: string, amount: Paise): JournalLine {
  return { account, debit: 0n, credit: amount };
}

/**
 * Append-only general ledger. Entries are validated, frozen and never edited.
 * Corrections are made with reverse().
 */
export class Ledger {
  readonly accounts: ReadonlyMap<string, Account>;
  private readonly entries: JournalEntry[] = [];

  constructor(chart: readonly Account[] = CHART_OF_ACCOUNTS) {
    const map = new Map<string, Account>();
    for (const a of chart) {
      if (map.has(a.code)) throw new LedgerError(`Duplicate account code ${a.code}`);
      map.set(a.code, a);
    }
    this.accounts = map;
  }

  post(draft: JournalDraft): JournalEntry {
    this.validate(draft);
    // Zero-amount lines carry no information; drop them so statements stay clean.
    const lines = draft.lines
      .filter((l) => l.debit !== 0n || l.credit !== 0n)
      .map((l) => Object.freeze({ ...l }));
    const entry: JournalEntry = Object.freeze({
      ...draft,
      id: this.entries.length + 1,
      lines: Object.freeze(lines),
    });
    this.entries.push(entry);
    return entry;
  }

  /** Post the mirror image of an existing entry on the given date. */
  reverse(id: number, date: SimDate, memo = `Reversal of entry ${id}`): JournalEntry {
    const original = this.entries.find((e) => e.id === id);
    if (!original) throw new LedgerError(`No entry ${id} to reverse`);
    if (this.entries.some((e) => e.reversalOf === id)) throw new LedgerError(`Entry ${id} is already reversed`);
    const draft: JournalDraft = {
      date,
      memo,
      source: `Reversal:${original.source}`,
      lines: original.lines.map((l) => ({ account: l.account, debit: l.credit, credit: l.debit })),
    };
    this.validate(draft);
    const entry: JournalEntry = Object.freeze({
      ...draft,
      id: this.entries.length + 1,
      reversalOf: id,
      lines: Object.freeze(draft.lines.map((l) => Object.freeze({ ...l }))),
    });
    this.entries.push(entry);
    return entry;
  }

  all(): readonly JournalEntry[] {
    return this.entries;
  }

  /** Entries with from <= date <= to (inclusive; either bound optional). */
  between(from?: SimDate, to?: SimDate): JournalEntry[] {
    return this.entries.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
  }

  /** Signed balance, debit positive, for entries dated on or before asAt. */
  debitBalance(account: string, asAt?: SimDate, from?: SimDate): Paise {
    if (!this.accounts.has(account)) throw new LedgerError(`Unknown account ${account}`);
    let total = 0n;
    for (const e of this.between(from, asAt)) {
      for (const l of e.lines) if (l.account === account) total += l.debit - l.credit;
    }
    return total;
  }

  private validate(draft: JournalDraft): void {
    if (!ISO_DATE.test(draft.date) || Number.isNaN(Date.parse(draft.date))) {
      throw new LedgerError(`Invalid date "${draft.date}"`);
    }
    const nonZero = draft.lines.filter((l) => l.debit !== 0n || l.credit !== 0n);
    if (nonZero.length < 2) throw new LedgerError(`Entry "${draft.memo}" needs at least two non-zero lines`);
    let debits = 0n;
    let credits = 0n;
    for (const l of draft.lines) {
      if (!this.accounts.has(l.account)) throw new LedgerError(`Unknown account ${l.account} in "${draft.memo}"`);
      if (l.debit < 0n || l.credit < 0n) throw new LedgerError(`Negative amount on ${l.account} in "${draft.memo}"`);
      if (l.debit !== 0n && l.credit !== 0n) throw new LedgerError(`Line on ${l.account} has both debit and credit`);
      debits += l.debit;
      credits += l.credit;
    }
    if (debits !== credits) {
      throw new LedgerError(`Entry "${draft.memo}" is unbalanced: Dr ${debits} vs Cr ${credits} paise`);
    }
  }
}
