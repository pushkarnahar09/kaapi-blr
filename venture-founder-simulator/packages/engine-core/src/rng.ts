/**
 * Seeded, reproducible randomness (blueprint doc 06, section 3.3).
 *
 * xoshiro128** seeded through splitmix32. Each subsystem draws from its own named stream,
 * so adding draws in one stream (say "demand") never shifts the draws in another ("events").
 *
 * Integer generation is bit-exact on every JavaScript engine. normal() and poisson() use
 * Math.log/exp/cos, whose last-bit precision the language spec leaves to the engine; results
 * are identical on the same engine, and we round to whole units wherever counts are needed.
 */

function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function splitmix32(state: number): () => number {
  let s = state >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

const rotl = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;

export class Rng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;
  /** Number of 32-bit draws taken; logged so events can be traced. */
  draws = 0;

  constructor(seed: number, stream: string) {
    const mix = splitmix32((seed >>> 0) ^ fnv1a32(stream));
    this.s0 = mix();
    this.s1 = mix();
    this.s2 = mix();
    this.s3 = mix();
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) this.s0 = 1;
  }

  /** Build from a raw 128-bit state. For reference-vector tests only. */
  static fromState(state: readonly [number, number, number, number]): Rng {
    const rng = new Rng(0, "");
    [rng.s0, rng.s1, rng.s2, rng.s3] = state.map((x) => x >>> 0) as [number, number, number, number];
    return rng;
  }

  /** Next unsigned 32-bit integer. */
  nextUint32(): number {
    this.draws++;
    const result = Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    this.s0 >>>= 0;
    this.s1 >>>= 0;
    this.s2 >>>= 0;
    return result;
  }

  /** Uniform in [0, 1). */
  next(): number {
    return this.nextUint32() / 4_294_967_296;
  }

  /** Uniform integer in [min, max], inclusive, without modulo bias. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new Error(`Bad range ${min}..${max}`);
    const span = max - min + 1;
    if (span > 4_294_967_296) throw new Error("Range too large");
    const limit = 4_294_967_296 - (4_294_967_296 % span);
    let x: number;
    do x = this.nextUint32();
    while (x >= limit);
    return min + (x % span);
  }

  bernoulli(p: number): boolean {
    return this.next() < p;
  }

  /** Normal via Box-Muller. */
  normal(mean: number, sd: number): number {
    const u1 = 1 - this.next(); // (0, 1]
    const u2 = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /** Poisson count. Knuth's method for small means, rounded normal approximation above 50. */
  poisson(mean: number): number {
    if (mean < 0) throw new Error("Poisson mean must be >= 0");
    if (mean === 0) return 0;
    if (mean > 50) return Math.max(0, Math.round(this.normal(mean, Math.sqrt(mean))));
    const limit = Math.exp(-mean);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > limit);
    return k - 1;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Cannot pick from an empty list");
    return items[this.int(0, items.length - 1)]!;
  }
}

/** One Rng per named stream, all derived from a single scenario seed. */
export class RngStreams {
  private readonly streams = new Map<string, Rng>();
  constructor(readonly seed: number) {
    if (!Number.isInteger(seed)) throw new Error("Seed must be an integer");
  }

  stream(name: string): Rng {
    let rng = this.streams.get(name);
    if (!rng) {
      rng = new Rng(this.seed, name);
      this.streams.set(name, rng);
    }
    return rng;
  }

  /** Draw counts per stream, for the event log and replay checks. */
  usage(): Record<string, number> {
    return Object.fromEntries([...this.streams].sort(([a], [b]) => a.localeCompare(b)).map(([k, r]) => [k, r.draws]));
  }
}
