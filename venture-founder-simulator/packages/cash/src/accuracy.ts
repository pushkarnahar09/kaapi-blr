/**
 * Forecast accuracy (doc 10, section 7): compare a frozen forecast with what actually happened.
 */
import { CASH_ACCOUNTS, cashBalance, type Ledger, type Paise, type SimDate } from "@vfs/ledger";
import type { CashForecast } from "./forecast.js";

export interface PeriodAccuracy {
  readonly label: string;
  readonly start: SimDate;
  readonly end: SimDate;
  readonly forecastInflows: Paise;
  readonly actualInflows: Paise;
  readonly forecastOutflows: Paise;
  readonly actualOutflows: Paise;
  readonly forecastClosing: Paise;
  readonly actualClosing: Paise;
}

export interface ForecastAccuracy {
  readonly periods: readonly PeriodAccuracy[];
  /** Weighted absolute percentage error = Σ|forecast - actual| / Σ|actual|, as a fraction. */
  readonly inflowWape: number;
  readonly outflowWape: number;
  readonly closingErrorAtEnd: Paise;
}

const cash = new Set<string>(CASH_ACCOUNTS);

/** Gross cash in and out per entry (an entry that moves cash both ways counts its net). */
function actualFlows(ledger: Ledger, from: SimDate, to: SimDate): { inflows: Paise; outflows: Paise } {
  let inflows = 0n;
  let outflows = 0n;
  for (const e of ledger.between(from, to)) {
    let net = 0n;
    for (const l of e.lines) if (cash.has(l.account)) net += l.debit - l.credit;
    if (net > 0n) inflows += net;
    else outflows += net;
  }
  return { inflows, outflows };
}

/** Accuracy for every forecast period that has fully closed by `through`. */
export function forecastAccuracy(forecast: CashForecast, ledger: Ledger, through: SimDate): ForecastAccuracy {
  const periods: PeriodAccuracy[] = [];
  for (const p of forecast.periods) {
    if (p.end > through) break;
    const a = actualFlows(ledger, p.start, p.end);
    periods.push({
      label: p.label,
      start: p.start,
      end: p.end,
      forecastInflows: p.inflows,
      actualInflows: a.inflows,
      forecastOutflows: p.outflows,
      actualOutflows: a.outflows,
      forecastClosing: p.closing,
      actualClosing: cashBalance(ledger, p.end),
    });
  }
  const abs = (x: Paise) => (x < 0n ? -x : x);
  const wape = (pick: (p: PeriodAccuracy) => [Paise, Paise]) => {
    let err = 0n;
    let base = 0n;
    for (const p of periods) {
      const [f, a] = pick(p);
      err += abs(f - a);
      base += abs(a);
    }
    return base === 0n ? 0 : Number((err * 1_000_000n) / base) / 1_000_000;
  };
  const lastP = periods[periods.length - 1];
  return {
    periods,
    inflowWape: wape((p) => [p.forecastInflows, p.actualInflows]),
    outflowWape: wape((p) => [p.forecastOutflows, p.actualOutflows]),
    closingErrorAtEnd: lastP ? lastP.forecastClosing - lastP.actualClosing : 0n,
  };
}
