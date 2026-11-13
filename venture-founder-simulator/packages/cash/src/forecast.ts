/**
 * 13-week direct cash flow forecast (blueprint doc 10).
 * Computed daily, shown weekly (Monday to Sunday) with a stub week if the forecast does not start on a Monday.
 */
import { addDays, eachDay, weekday } from "@vfs/engine-core";
import { cashBalance, formatINR, type Ledger, type Paise, type SimDate } from "@vfs/ledger";
import type { CashItem } from "./items.js";

export interface ForecastPeriod {
  readonly label: string;
  readonly start: SimDate;
  readonly end: SimDate;
  readonly opening: Paise;
  readonly byCategory: Readonly<Record<string, Paise>>;
  readonly inflows: Paise;
  readonly outflows: Paise;
  readonly net: Paise;
  readonly closing: Paise;
  readonly headroom: Paise;
}

export interface Shortfall {
  readonly date: SimDate;
  readonly severity: "below_buffer" | "below_zero";
  readonly closing: Paise;
  readonly threshold: Paise;
  readonly shortBy: Paise;
  /** Largest outflows from the start of the breach week up to the breach date. */
  readonly drivers: readonly CashItem[];
  /** Single outflows that, if moved after the breach date, would keep cash at or above the threshold that day. */
  readonly singleFixes: readonly CashItem[];
  /** Receipts the previous forecast expected by this date that have now moved later. */
  readonly delayedReceipts: readonly { item: CashItem; previousDate: SimDate }[];
}

export interface CashForecast {
  readonly asAt: SimDate;
  readonly opening: Paise;
  readonly buffer: Paise;
  readonly periods: readonly ForecastPeriod[];
  readonly daily: readonly { date: SimDate; closing: Paise }[];
  readonly items: readonly CashItem[];
  readonly lowestPoint: { date: SimDate; closing: Paise };
  readonly firstBelowBuffer: Shortfall | null;
  readonly firstBelowZero: Shortfall | null;
}

export interface ForecastInput {
  readonly ledger: Ledger;
  /** Last closed day. The forecast starts the day after. */
  readonly asAt: SimDate;
  readonly items: readonly CashItem[];
  readonly buffer: Paise;
  readonly weeks?: number;
  /** Last week's forecast, to detect receipts that slipped. */
  readonly previous?: CashForecast;
}

/** Stub period to the first Sunday (if needed), then whole Monday-to-Sunday weeks. */
export function forecastPeriods(asAt: SimDate, weeks = 13): { label: string; start: SimDate; end: SimDate }[] {
  const out = [];
  let start = addDays(asAt, 1);
  if (weekday(start) !== 0) {
    const end = addDays(start, 6 - weekday(start));
    out.push({ label: "Stub", start, end });
    start = addDays(end, 1);
  }
  for (let w = 1; w <= weeks; w++) {
    const end = addDays(start, 6);
    out.push({ label: `W${w}`, start, end });
    start = addDays(end, 1);
  }
  return out;
}

export function forecast13Week(input: ForecastInput): CashForecast {
  const { ledger, asAt, buffer } = input;
  const periodsDef = forecastPeriods(asAt, input.weeks ?? 13);
  const first = periodsDef[0]!.start;
  const last = periodsDef[periodsDef.length - 1]!.end;

  for (const i of input.items) {
    if (i.date <= asAt) throw new Error(`Cash item "${i.label}" is dated ${i.date}, not after the forecast date ${asAt}`);
  }
  const items = input.items.filter((i) => i.date <= last).slice().sort(byDateThenId);
  const opening = cashBalance(ledger, asAt);

  // Daily walk.
  const byDay = new Map<SimDate, Paise>();
  for (const i of items) byDay.set(i.date, (byDay.get(i.date) ?? 0n) + i.amount);
  const daily: { date: SimDate; closing: Paise }[] = [];
  let bal = opening;
  for (const d of eachDay(first, last)) {
    bal += byDay.get(d) ?? 0n;
    daily.push({ date: d, closing: bal });
  }

  // Weekly view.
  const periods: ForecastPeriod[] = [];
  let periodOpening = opening;
  for (const p of periodsDef) {
    const byCategory: Record<string, Paise> = {};
    let inflows = 0n;
    let outflows = 0n;
    for (const i of items) {
      if (i.date < p.start || i.date > p.end) continue;
      byCategory[i.category] = (byCategory[i.category] ?? 0n) + i.amount;
      if (i.amount > 0n) inflows += i.amount;
      else outflows += i.amount;
    }
    const net = inflows + outflows;
    const closing = periodOpening + net;
    periods.push({ ...p, opening: periodOpening, byCategory, inflows, outflows, net, closing, headroom: closing - buffer });
    periodOpening = closing;
  }

  const lowestPoint = daily.reduce((lo, d) => (d.closing < lo.closing ? d : lo), daily[0]!);
  const ctx = { items, daily, periods, previous: input.previous };
  return {
    asAt,
    opening,
    buffer,
    periods,
    daily,
    items,
    lowestPoint,
    firstBelowBuffer: findShortfall(ctx, buffer, "below_buffer"),
    firstBelowZero: findShortfall(ctx, 0n, "below_zero"),
  };
}

/** Payments whose deferral is a legal breach or a default, not a cash-management lever. */
export const NOT_DEFERRABLE: ReadonlySet<string> = new Set(["Statutory dues (TDS, PF, PT)", "GST", "Payroll", "Debt service"]);

function byDateThenId(a: CashItem, b: CashItem): number {
  return a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date);
}

function findShortfall(
  ctx: { items: readonly CashItem[]; daily: readonly { date: SimDate; closing: Paise }[]; periods: readonly ForecastPeriod[]; previous: CashForecast | undefined },
  threshold: Paise,
  severity: Shortfall["severity"],
): Shortfall | null {
  const hit = ctx.daily.find((d) => d.closing < threshold);
  if (!hit) return null;
  const shortBy = threshold - hit.closing;
  const period = ctx.periods.find((p) => hit.date >= p.start && hit.date <= p.end)!;

  const drivers = ctx.items
    .filter((i) => i.amount < 0n && i.date >= period.start && i.date <= hit.date)
    .sort((a, b) => (a.amount === b.amount ? 0 : a.amount < b.amount ? -1 : 1))
    .slice(0, 5);

  // Every earlier day was at or above the threshold, so deferring any one outflow of at least
  // `shortBy` past the breach date keeps that date above the line. Only lawful, negotiable
  // payments are offered; statutory dues, GST, wages and loan instalments are never suggested.
  const singleFixes = ctx.items
    .filter((i) => i.amount < 0n && i.date <= hit.date && -i.amount >= shortBy && !NOT_DEFERRABLE.has(i.category))
    .sort((a, b) => (a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1));

  const delayedReceipts: { item: CashItem; previousDate: SimDate }[] = [];
  if (ctx.previous) {
    const before = new Map(ctx.previous.items.map((i) => [i.id, i]));
    for (const i of ctx.items) {
      const was = before.get(i.id);
      if (i.amount > 0n && was && was.date <= hit.date && i.date > was.date) delayedReceipts.push({ item: i, previousDate: was.date });
    }
    for (const was of ctx.previous.items) {
      // A receipt that disappeared from the window entirely has also slipped.
      if (was.amount > 0n && was.date <= hit.date && was.date > ctx.daily[0]!.date && !ctx.items.some((i) => i.id === was.id)) {
        delayedReceipts.push({ item: was, previousDate: was.date });
      }
    }
  }

  return { date: hit.date, severity, closing: hit.closing, threshold, shortBy, drivers, singleFixes, delayedReceipts };
}

/** Cash buffer suggestion: k weeks of average operating outflows over the next 4 weeks (MODEL ASSUMPTION, k = 4). */
export function suggestedBuffer(items: readonly CashItem[], asAt: SimDate, k = 4): Paise {
  const until = addDays(asAt, 28);
  let out = 0n;
  for (const i of items) if (i.section === "payments" && i.amount < 0n && i.date > asAt && i.date <= until) out -= i.amount;
  return (out * BigInt(k)) / 4n;
}

const LONG_DATE = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const longDate = (d: SimDate) => LONG_DATE.format(new Date(`${d}T00:00:00Z`));

/** Plain-English explanation of a shortfall, in the style of doc 10, section 6. */
export function describeShortfall(s: Shortfall): string {
  const what = s.severity === "below_zero" ? "Cash goes negative" : `Cash falls below your ${formatINR(s.threshold)} buffer`;
  const parts = [`${what} on ${longDate(s.date)}, short by ${formatINR(s.shortBy)}.`];
  if (s.drivers.length) {
    parts.push(`Biggest payments that week: ${s.drivers.slice(0, 3).map((d) => `${d.label} ${formatINR(-d.amount)} (${longDate(d.date)})`).join("; ")}.`);
  }
  if (s.delayedReceipts.length) {
    parts.push(`Receipts that slipped since the last forecast: ${s.delayedReceipts.map((r) => `${r.item.label} ${formatINR(r.item.amount)}, expected ${longDate(r.previousDate)}`).join("; ")}.`);
  }
  if (s.singleFixes.length) {
    const f = s.singleFixes[0]!;
    parts.push(`Moving "${f.label}" (${formatINR(-f.amount)}) to after that date would keep you above the line that day.`);
  }
  return parts.join(" ");
}
