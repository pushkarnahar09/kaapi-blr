import { describe, expect, it } from "vitest";
import {
  addDays, addMonths, BusinessCalendar, daysBetween, endOfMonth, fiscalYear, startOfWeek, weekday,
} from "../src/calendar.js";
import { canonicalJson, stableHash } from "../src/hash.js";
import { Rng, RngStreams } from "../src/rng.js";

describe("calendar", () => {
  it("knows the simulation start is a Friday", () => {
    expect(weekday("2026-11-13")).toBe(4);
    expect(startOfWeek("2026-11-13")).toBe("2026-11-09");
  });

  it("does date arithmetic across months, years and leap days", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-11-13", "2027-02-14")).toBe(93);
    expect(endOfMonth("2027-02-10")).toBe("2027-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2026-11-13", 3)).toBe("2027-02-13");
  });

  it("rejects impossible dates", () => {
    expect(() => addDays("2027-02-30", 1)).toThrow();
    expect(() => addDays("13-11-2026", 1)).toThrow();
  });

  it("labels Indian fiscal years April to March", () => {
    expect(fiscalYear("2026-11-13")).toBe("FY2026-27");
    expect(fiscalYear("2027-03-31")).toBe("FY2026-27");
    expect(fiscalYear("2027-04-01")).toBe("FY2027-28");
  });

  it("skips weekends and listed holidays for settlements", () => {
    const cal = new BusinessCalendar({ holidays: ["2026-11-16"] });
    expect(cal.onOrAfter("2026-11-14")).toBe("2026-11-17"); // Sat -> Sun -> Mon (holiday) -> Tue
    expect(cal.addBusinessDays("2026-11-13", 1)).toBe("2026-11-17");
    expect(new BusinessCalendar().addBusinessDays("2026-11-13", 2)).toBe("2026-11-17");
  });
});

describe("rng", () => {
  it("matches the published xoshiro128** reference vector", () => {
    const r = Rng.fromState([1, 2, 3, 4]);
    expect([1, 2, 3, 4, 5].map(() => r.nextUint32())).toEqual([11520, 0, 5927040, 70819200, 2031721883]);
  });

  it("is pinned for a known seed (guards against accidental changes)", () => {
    const r = new Rng(20261113, "demand");
    expect([r.nextUint32(), r.nextUint32(), r.nextUint32(), r.nextUint32()]).toEqual([1081207234, 520889971, 4293309782, 2992098806]);
  });

  it("keeps streams independent", () => {
    const a = new RngStreams(7);
    const b = new RngStreams(7);
    for (let i = 0; i < 1000; i++) a.stream("events").next(); // heavy use of one stream
    expect(a.stream("demand").next()).toBe(b.stream("demand").next());
    expect(new RngStreams(7).stream("demand").next()).not.toBe(new RngStreams(8).stream("demand").next());
  });

  it("produces sensible distributions", () => {
    const r = new Rng(1, "test");
    const n = 20000;
    let ints = 0, pois = 0, norm = 0;
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const x = r.int(1, 6);
      counts[x - 1]!++;
      ints += x;
      pois += r.poisson(12);
      norm += r.normal(100, 15);
    }
    expect(ints / n).toBeCloseTo(3.5, 1);
    for (const c of counts) expect(Math.abs(c / n - 1 / 6)).toBeLessThan(0.01);
    expect(pois / n).toBeCloseTo(12, 0);
    expect(norm / n).toBeCloseTo(100, 0);
    expect(r.poisson(0)).toBe(0);
    expect(r.poisson(400)).toBeGreaterThan(300);
  });
});

describe("hash", () => {
  it("ignores key order and handles bigint", () => {
    expect(canonicalJson({ b: 1n, a: [2, { d: 3, c: 4 }] })).toBe('{"a":[2,{"c":4,"d":3}],"b":"1n"}');
    expect(stableHash({ x: 1, y: 2 })).toBe(stableHash({ y: 2, x: 1 }));
    expect(stableHash({ x: 1n })).not.toBe(stableHash({ x: 2n }));
  });

  it("refuses values that cannot be hashed reliably", () => {
    expect(() => stableHash({ m: new Map() })).toThrow();
    expect(() => stableHash({ n: Number.NaN })).toThrow();
  });
});
