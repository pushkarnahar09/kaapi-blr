/**
 * Canonical serialisation and a stable hash, used to prove that replaying a scenario
 * reproduces exactly the same state and books.
 */

/** JSON with sorted keys; bigint written as "<digits>n"; undefined object fields dropped. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalise(value));
}

function normalise(value: unknown): unknown {
  if (typeof value === "bigint") return `${value}n`;
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`Cannot hash non-finite number ${value}`);
    if (typeof value === "function" || typeof value === "symbol") throw new Error("Cannot hash functions or symbols");
    return value;
  }
  if (Array.isArray(value)) return value.map(normalise);
  if (value instanceof Map || value instanceof Set) throw new Error("Use plain objects and arrays in hashed state");
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const v = (value as Record<string, unknown>)[key];
    if (v !== undefined) out[key] = normalise(v);
  }
  return out;
}

/** FNV-1a 64-bit over UTF-16 code units. Not cryptographic; for change detection only. */
export function fnv1a64(text: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * prime) & mask;
  }
  return h.toString(16).padStart(16, "0");
}

export function stableHash(value: unknown): string {
  return fnv1a64(canonicalJson(value));
}
