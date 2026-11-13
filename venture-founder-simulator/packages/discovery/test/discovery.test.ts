import { describe, expect, it } from "vitest";
import { allTasks, nextActions } from "../src/actions.js";
import { INDUSTRIES, industryById } from "../src/industries.js";
import { emptyProfile, isProfileComplete, profileFlags, type FounderProfile } from "../src/profile.js";
import { capitalScoreFor, CRITERIA, defaultWeights, rankSensitivity, scoreIndustry } from "../src/scoring.js";
import { chooseLead, loadGame, newGame, stage, toggleShortlist, type GameState } from "../src/state.js";

/** A part-time Chartered Accountant with finance strengths, exploring for learning. */
function caProfile(): FounderProfile {
  return {
    ...emptyProfile(),
    purpose: "learning",
    motivation: ["Build business judgement"],
    successIn3Years: ["Independence"],
    qualifications: ["Chartered Accountant"],
    skills: { finance: 4, sales: 1, ops: 1, people: 2, tech: 2, domain: 1, compliance: 3 },
    hoursPerWeek: 20,
    personalCapital: 25_00_000,
    maxExposure: 15_00_000,
    riskTolerance: 3,
    physicalOps: "maybe",
    interests: ["tech", "services"],
    coFounder: "open",
    outcome: "undecided",
    restrictions: "unsure",
    exitHorizon: "undecided",
  };
}

const ind = (id: string) => industryById(id)!;

describe("taxonomy", () => {
  it("covers all eight families with unique ids, and 12 researched industries", () => {
    expect(new Set(INDUSTRIES.map((i) => i.family)).size).toBe(8);
    expect(new Set(INDUSTRIES.map((i) => i.id)).size).toBe(INDUSTRIES.length);
    expect(INDUSTRIES.filter((i) => i.card).length).toBe(12);
  });

  it("keeps every judged score between 1 and 5 with low <= base <= high", () => {
    for (const i of INDUSTRIES) {
      if (!i.card) continue;
      for (const [code, s] of Object.entries(i.card.scores)) {
        expect(s.low, `${i.id}.${code}`).toBeGreaterThanOrEqual(1);
        expect(s.high, `${i.id}.${code}`).toBeLessThanOrEqual(5);
        expect(s.low <= s.base && s.base <= s.high, `${i.id}.${code}`).toBe(true);
        expect(s.why.length).toBeGreaterThan(10);
      }
      expect(i.card.fieldTasks.length).toBeGreaterThan(0);
      expect(i.card.unknowns.length).toBeGreaterThan(0);
    }
  });

  it("states no market sizes or growth rates as fact", () => {
    const text = JSON.stringify(INDUSTRIES);
    expect(text).not.toMatch(/CAGR|\d+% (growth|market share)/i);
  });
});

describe("profile", () => {
  it("knows when the profile is complete and raises the right flags", () => {
    expect(isProfileComplete(emptyProfile())).toBe(false);
    const p = caProfile();
    expect(isProfileComplete(p)).toBe(true);
    const codes = profileFlags(p).map((f) => f.code);
    expect(codes).toContain("restriction");
    expect(codes).toContain("icai");
    expect(profileFlags({ ...p, maxExposure: 30_00_000 }).map((f) => f.code)).toContain("exposure_above_capital");
  });
});

describe("opportunity scoring", () => {
  it("maps capital need against maximum exposure", () => {
    expect(capitalScoreFor(2_00_000, 10_00_000)).toBe(5);
    expect(capitalScoreFor(5_00_000, 10_00_000)).toBe(4);
    expect(capitalScoreFor(10_00_000, 10_00_000)).toBe(3);
    expect(capitalScoreFor(20_00_000, 10_00_000)).toBe(2);
    expect(capitalScoreFor(20_00_001, 10_00_000)).toBe(1);
  });

  it("scores an unresearched industry with maximum uncertainty (hand-checked)", () => {
    const s = scoreIndustry(ind("bakery-desserts"), emptyProfile(), defaultWeights());
    expect(s.researched).toBe(false);
    expect(s.base).toBe(60);
    expect(s.low).toBe(23); // (90 x 1 + 10 x 2.5) / 100 x 20
    expect(s.high).toBe(97); // (90 x 5 + 10 x 3.5) / 100 x 20
    expect(s.evidenceCoverage).toBe(0.05); // only founder fit (your input, weight 10) counts
  });

  it("raises knockouts that match the founder, without hiding the score", () => {
    const p = caProfile();
    expect(scoreIndustry(ind("physio-clinic"), p, defaultWeights()).knockouts.map((k) => k.code)).toEqual(["licence"]);
    expect(scoreIndustry(ind("accounting-services"), p, defaultWeights()).knockouts).toEqual([]);
    const cafe = scoreIndustry(ind("speciality-coffee"), p, defaultWeights());
    expect(cafe.knockouts.map((k) => k.code)).toEqual(["time"]);
    expect(cafe.base).toBeGreaterThan(20);
  });

  it("rewards founder fit: a CA fits accounting services better than a cafe", () => {
    const p = caProfile();
    const fit = (id: string) => scoreIndustry(ind(id), p, defaultWeights()).criteria.find((c) => c.code === "fit")!.base;
    expect(fit("accounting-services")).toBeGreaterThan(fit("speciality-coffee"));
  });

  it("uses the player's own scores when given, and counts their evidence", () => {
    const p = caProfile();
    const before = scoreIndustry(ind("speciality-coffee"), p, defaultWeights());
    const after = scoreIndustry(ind("speciality-coffee"), p, defaultWeights(), {
      whitespace: { low: 3, base: 4, high: 4, evidence: "field_observation", note: "Few cafes near the new metro station" },
    });
    expect(after.base).toBeGreaterThan(before.base);
    expect(after.evidenceCoverage).toBeGreaterThan(before.evidenceCoverage);
    expect(after.criteria.find((c) => c.code === "whitespace")!.overridden).toBe(true);
  });

  it("describes capital bands cleanly and keeps derived scores to one decimal", () => {
    const cafe = scoreIndustry(ind("speciality-coffee"), caProfile(), defaultWeights());
    expect(cafe.criteria.find((c) => c.code === "capital")!.why).toContain("₹10 lakh to ₹2 crore (a model assumption band");
    expect(scoreIndustry(ind("vertical-saas"), caProfile(), defaultWeights()).criteria.find((c) => c.code === "capital")!.why).toContain("up to ₹50 lakh");
    for (const c of cafe.criteria) for (const v of [c.low, c.base, c.high]) expect(Math.round(v * 10) / 10).toBe(v);
  });

  it("treats zero weights safely", () => {
    const zero = Object.fromEntries(CRITERIA.map((c) => [c.code, 0])) as ReturnType<typeof defaultWeights>;
    expect(scoreIndustry(ind("speciality-coffee"), caProfile(), zero).base).toBe(60);
  });

  it("detects when the ranking hangs on a single weight", () => {
    const p = emptyProfile();
    const overrides = {
      "bakery-desserts": { pain: { low: 5, base: 5, high: 5, evidence: "user_input" as const, note: "" } },
      "pizza-global": { margin: { low: 5, base: 5, high: 5, evidence: "user_input" as const, note: "" } },
    };
    const s = rankSensitivity([ind("bakery-desserts"), ind("pizza-global")], p, defaultWeights(), overrides);
    expect(s.top).toBe("bakery-desserts"); // pain weighs 10, margin 8
    expect(s.stable).toBe(false);
    expect(s.sensitiveTo).toEqual(expect.arrayContaining(["pain", "margin"]));
  });
});

describe("game state and Action Centre", () => {
  const complete = (): GameState => ({ ...newGame(), profile: caProfile() });

  it("asks only for the profile at the very start", () => {
    const t = nextActions(newGame());
    expect(t.map((x) => x.id)).toEqual(["profile"]);
    expect(stage(newGame())).toBe(0);
  });

  it("pins the restriction check and asks for a shortlist once the profile is done", () => {
    const t = nextActions(complete());
    expect(t[0]!.id).toBe("restriction");
    expect(t.map((x) => x.id)).toContain("shortlist");
    expect(stage(complete())).toBe(1);
  });

  it("generates per-industry work after shortlisting, capped at 7 with at most one learning task", () => {
    let g = complete();
    for (const id of ["speciality-coffee", "accounting-services", "vertical-saas", "physio-clinic"]) g = toggleShortlist(g, id);
    expect(() => toggleShortlist(g, "pet-grooming")).toThrow();
    const ids = allTasks(g).map((t) => t.id);
    expect(ids).toContain("disconfirm:speciality-coffee");
    expect(ids).toContain("field:vertical-saas:0");
    expect(ids).toContain("knockout:physio-clinic:licence");
    const shown = nextActions(g);
    expect(shown.length).toBeLessThanOrEqual(7);
    expect(shown.filter((t) => t.kind === "learning").length).toBeLessThanOrEqual(1);
    for (let i = 1; i < shown.length; i++) {
      if (!shown[i]!.pinned && !shown[i - 1]!.pinned) expect(shown[i - 1]!.priority).toBeGreaterThanOrEqual(shown[i]!.priority);
    }
  });

  it("requires a disconfirming test and real reasoning before choosing a lead industry", () => {
    let g = toggleShortlist(complete(), "accounting-services");
    expect(() => chooseLead(g, "accounting-services", "Because I know this work well and can start quickly.")).toThrow(/change your mind/);
    g = { ...g, disconfirm: { "accounting-services": "If fewer than 3 of 8 founders would pay ₹10,000 a month" } };
    expect(() => chooseLead(g, "accounting-services", "Fits")).toThrow(/reasoning/);
    g = chooseLead(g, "accounting-services", "Strong founder fit, low capital, recurring revenue; demand still unproven.");
    expect(g.leadIndustry).toBe("accounting-services");
    expect(stage(g)).toBe(2);
    expect(g.decisions.at(-1)!.type).toBe("LeadIndustryChosen");
  });

  it("round-trips a save through JSON and rejects junk", () => {
    const g = toggleShortlist(complete(), "vertical-saas");
    const back = loadGame(JSON.parse(JSON.stringify(g)));
    expect(back).toEqual(g);
    expect(() => loadGame({ hello: "world" })).toThrow();
    expect(loadGame({ version: 1, shortlist: ["not-real", "vertical-saas"] }).shortlist).toEqual(["vertical-saas"]);
  });
});
