/**
 * Money is always an integer number of paise held in a bigint.
 * Floating point never touches an amount.
 */
export type Paise = bigint;

/** Basis points: 10000 bp = 100%. 18% GST = 1800 bp. */
export type BasisPoints = number;

const PAISE_PER_RUPEE = 100n;

/** Parse a rupee string like "1,05,000.50" or "1050" into paise. Rejects more than 2 decimals. */
export function rupees(input: string | number): Paise {
  const text = String(input).replace(/[₹,\s]/g, "");
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new Error(`Not a valid rupee amount: "${input}"`);
  const [, sign, whole, frac = ""] = match;
  const paise = BigInt(whole!) * PAISE_PER_RUPEE + BigInt(frac.padEnd(2, "0"));
  return sign ? -paise : paise;
}

/** Integer division rounded half away from zero. */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (n * 2n + d) / (d * 2n);
  return negative ? -q : q;
}

/** amount × rate, rounded to the nearest paisa (half up). */
export function applyRate(amount: Paise, rateBp: BasisPoints): Paise {
  if (!Number.isInteger(rateBp)) throw new Error(`Rate must be whole basis points, got ${rateBp}`);
  return divRoundHalfUp(amount * BigInt(rateBp), 10_000n);
}

/** Format paise as Indian rupees with lakh/crore grouping, e.g. ₹12,34,567.89 */
export function formatINR(amount: Paise): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const whole = (abs / PAISE_PER_RUPEE).toString();
  const frac = (abs % PAISE_PER_RUPEE).toString().padStart(2, "0");
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `${negative ? "-" : ""}₹${grouped}.${frac}`;
}
