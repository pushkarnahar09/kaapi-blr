/**
 * Business dates as ISO "YYYY-MM-DD" strings, computed in UTC so the result never
 * depends on the machine's time zone.
 */
import type { SimDate } from "@vfs/ledger";

const DAY_MS = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toEpochDay(date: SimDate): number {
  if (!ISO.test(date)) throw new Error(`Invalid date "${date}"`);
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) throw new Error(`Invalid date "${date}"`);
  return ms / DAY_MS;
}

function fromEpochDay(day: number): SimDate {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(date: SimDate, days: number): SimDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** Whole days from a to b (positive if b is later). */
export function daysBetween(a: SimDate, b: SimDate): number {
  return toEpochDay(b) - toEpochDay(a);
}

/** ISO weekday: 0 = Monday ... 6 = Sunday. */
export function weekday(date: SimDate): number {
  return (new Date(toEpochDay(date) * DAY_MS).getUTCDay() + 6) % 7;
}

export const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function dayOfMonth(date: SimDate): number {
  return Number(date.slice(8, 10));
}

export function monthKey(date: SimDate): string {
  return date.slice(0, 7);
}

export function startOfMonth(date: SimDate): SimDate {
  return `${date.slice(0, 7)}-01`;
}

export function endOfMonth(date: SimDate): SimDate {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function isLastDayOfMonth(date: SimDate): boolean {
  return endOfMonth(date) === date;
}

/** Same day-of-month in another month, clamped to that month's last day. */
export function addMonths(date: SimDate, months: number): SimDate {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1 + months;
  const d = dayOfMonth(date);
  const target = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const last = dayOfMonth(endOfMonth(target));
  return `${target.slice(0, 8)}${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Monday of the ISO week containing date. */
export function startOfWeek(date: SimDate): SimDate {
  return addDays(date, -weekday(date));
}

/** Every date from `from` to `to`, inclusive. */
export function* eachDay(from: SimDate, to: SimDate): Generator<SimDate> {
  for (let d = toEpochDay(from), end = toEpochDay(to); d <= end; d++) yield fromEpochDay(d);
}

/** Indian fiscal year label, April to March: 2026-11-13 -> "FY2026-27". */
export function fiscalYear(date: SimDate): string {
  const y = Number(date.slice(0, 4));
  const start = Number(date.slice(5, 7)) >= 4 ? y : y - 1;
  return `FY${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Bank working days. Weekend days and the holiday list are inputs: the holiday list must come
 * from a verified source (e.g. the RBI holiday calendar for Karnataka) and is empty by default.
 * Treating Saturday and Sunday as non-working for settlements is a MODEL ASSUMPTION.
 */
export class BusinessCalendar {
  private readonly holidays: ReadonlySet<SimDate>;
  private readonly weekendDays: ReadonlySet<number>;

  constructor(options: { holidays?: Iterable<SimDate>; weekendDays?: Iterable<number> } = {}) {
    this.holidays = new Set(options.holidays ?? []);
    this.weekendDays = new Set(options.weekendDays ?? [5, 6]);
  }

  isBusinessDay(date: SimDate): boolean {
    return !this.weekendDays.has(weekday(date)) && !this.holidays.has(date);
  }

  /** The date itself if it is a business day, otherwise the next one. */
  onOrAfter(date: SimDate): SimDate {
    let d = date;
    for (let i = 0; !this.isBusinessDay(d); i++) {
      if (i > 366) throw new Error("No business day found within a year");
      d = addDays(d, 1);
    }
    return d;
  }

  /** n business days after date (n >= 1), e.g. T+1 settlement. */
  addBusinessDays(date: SimDate, n: number): SimDate {
    let d = date;
    for (let i = 0; i < n; i++) d = this.onOrAfter(addDays(d, 1));
    return d;
  }
}
