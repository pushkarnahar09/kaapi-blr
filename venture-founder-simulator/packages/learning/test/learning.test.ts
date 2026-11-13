import { describe, expect, it } from "vitest";
import { explainScore, GLOSSARY, termById } from "../src/index.js";

describe("glossary", () => {
  it("has unique ids and complete entries", () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
    for (const t of GLOSSARY) for (const f of [t.short, t.why, t.mistakes, t.informs]) expect(f.length).toBeGreaterThan(15);
    expect(termById("runway")?.formula).toContain("burn");
  });

  it("uses no em dashes in learner-facing copy", () => {
    expect(JSON.stringify(GLOSSARY)).not.toContain("—");
  });
});

describe("explain", () => {
  it("explains a score from the numbers it is given", () => {
    const text = explainScore({
      industryName: "Speciality coffee cafe", base: 58.4, low: 41, high: 72, evidenceCoverage: 0.32,
      drivers: [{ name: "Margin", score: 4, weight: 8 }], knockouts: ["Needs full-time presence."],
    }).join(" ");
    expect(text).toContain("58 out of 100");
    expect(text).toContain("41 to 72");
    expect(text).toContain("Only 32%");
    expect(text).toContain("margin (4.0 of 5, weight 8)");
    expect(text).toContain("Needs full-time presence.");
  });
});
