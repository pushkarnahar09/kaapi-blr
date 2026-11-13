/**
 * Opportunity scorecard (blueprint doc 04, section 3). Pure functions, no I/O.
 */
import { CAPITAL_BANDS, capitalRangeLabel, JUDGED_CRITERIA, type Industry, type JudgedCriterion } from "./industries.js";
import { CAPABILITIES, isPartTime, type FounderProfile } from "./profile.js";

export type EvidenceClass =
  | "verified_fact"
  | "third_party_estimate"
  | "field_observation"
  | "user_input"
  | "model_assumption"
  | "unknown";

export const EVIDENCE_LABEL: Record<EvidenceClass, string> = {
  verified_fact: "Verified fact",
  third_party_estimate: "Third-party estimate",
  field_observation: "Your field observation",
  user_input: "Your input",
  model_assumption: "Model assumption",
  unknown: "Unknown",
};

/** How much each evidence class counts towards evidence coverage (doc 04, 3.2). */
export const EVIDENCE_QUALITY: Record<EvidenceClass, number> = {
  verified_fact: 1,
  field_observation: 0.8,
  third_party_estimate: 0.6,
  user_input: 0.5,
  model_assumption: 0.3,
  unknown: 0,
};

export type CriterionCode = JudgedCriterion | "capital" | "fit";

export interface CriterionInfo {
  readonly code: CriterionCode;
  readonly name: string;
  readonly question: string;
  readonly defaultWeight: number;
}

export const CRITERIA: readonly CriterionInfo[] = [
  { code: "market", name: "Market attractiveness", question: "Is there large, growing local demand?", defaultWeight: 8 },
  { code: "pain", name: "Customer pain", question: "How badly do customers need this solved?", defaultWeight: 10 },
  { code: "wtp", name: "Willingness to pay", question: "Do customers pay for this today?", defaultWeight: 10 },
  { code: "whitespace", name: "Competitive whitespace", question: "Is there room for a new entrant?", defaultWeight: 8 },
  { code: "margin", name: "Gross margin potential", question: "How much is left after direct costs?", defaultWeight: 8 },
  { code: "recurring", name: "Repeat or recurring revenue", question: "Do customers come back on their own?", defaultWeight: 8 },
  { code: "capital", name: "Capital required", question: "How does the capital needed compare with what you can lose?", defaultWeight: 8 },
  { code: "time", name: "Time to first revenue", question: "How soon can you make the first sale?", defaultWeight: 5 },
  { code: "regulatory", name: "Regulatory simplicity", question: "How light are the licences and rules?", defaultWeight: 6 },
  { code: "operational", name: "Operational simplicity", question: "How easy is the business to run day to day?", defaultWeight: 6 },
  { code: "scalability", name: "Scalability", question: "Can it grow without you doing everything?", defaultWeight: 7 },
  { code: "fit", name: "Founder fit", question: "Do your skills, interests and time match?", defaultWeight: 10 },
  { code: "downside", name: "Contained downside", question: "If it fails, how much do you lose?", defaultWeight: 6 },
];

export type Weights = Record<CriterionCode, number>;

export function defaultWeights(): Weights {
  return Object.fromEntries(CRITERIA.map((c) => [c.code, c.defaultWeight])) as Weights;
}

export interface CriterionScore {
  readonly code: CriterionCode;
  readonly low: number;
  readonly base: number;
  readonly high: number;
  readonly evidence: EvidenceClass;
  readonly why: string;
  /** True if the player has replaced the starting judgement. */
  readonly overridden: boolean;
}

export interface ScoreOverride {
  readonly low: number;
  readonly base: number;
  readonly high: number;
  readonly evidence: EvidenceClass;
  readonly note: string;
}

export type Knockout = { readonly code: string; readonly message: string };

export interface OpportunityScore {
  readonly industryId: string;
  /** 20 to 100 (a 1-to-5 weighted average times 20). */
  readonly low: number;
  readonly base: number;
  readonly high: number;
  /** 0 to 1: share of weight resting on better-than-nothing evidence, quality-weighted. */
  readonly evidenceCoverage: number;
  readonly criteria: readonly CriterionScore[];
  readonly knockouts: readonly Knockout[];
  readonly researched: boolean;
}

const clamp = (x: number, lo = 1, hi = 5) => Math.min(hi, Math.max(lo, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Capital need in rupees for an industry: optimistic, central (geometric mean) and pessimistic. */
export function capitalNeed(industry: Industry): { optimistic: number; base: number; pessimistic: number } | null {
  if (!industry.card) return null;
  const [cheap, dear] = industry.card.capital;
  const optimistic = Math.max(CAPITAL_BANDS[cheap].min, 1_00_000);
  const pessimistic = CAPITAL_BANDS[dear].max;
  return { optimistic, base: Math.round(Math.sqrt(optimistic * pessimistic)), pessimistic };
}

/** Ratio of capital needed to your maximum exposure, mapped to 1-5 (5 = comfortably within). */
export function capitalScoreFor(need: number, maxExposure: number): number {
  const r = need / maxExposure;
  if (r <= 0.25) return 5;
  if (r <= 0.5) return 4;
  if (r <= 1) return 3;
  if (r <= 2) return 2;
  return 1;
}

function capitalCriterion(industry: Industry, profile: FounderProfile): CriterionScore {
  const need = capitalNeed(industry);
  if (!need) return { code: "capital", low: 1, base: 3, high: 5, evidence: "unknown", why: "No research card yet: capital needs unknown.", overridden: false };
  if (!profile.maxExposure) {
    return { code: "capital", low: 1, base: 3, high: 5, evidence: "unknown", why: "Set your maximum exposure in the founder profile to score this.", overridden: false };
  }
  const band = capitalRangeLabel(industry.card!.capital);
  return {
    code: "capital",
    low: capitalScoreFor(need.pessimistic, profile.maxExposure),
    base: capitalScoreFor(need.base, profile.maxExposure),
    high: capitalScoreFor(need.optimistic, profile.maxExposure),
    evidence: "model_assumption",
    why: `A first unit plausibly needs ${band} (a model assumption band; get quotations). Compared with your maximum exposure.`,
    overridden: false,
  };
}

/** Founder fit from skills, interests, appetite for physical operations and time (doc 04, 3.5). */
export function founderFit(industry: Industry, profile: FounderProfile): { score: number; why: string } {
  const card = industry.card;
  if (!card) return { score: 3, why: "No research card yet: required capabilities unknown." };
  const coFounderCredit = profile.coFounder === "yes" ? 0.4 : profile.coFounder === "open" ? 0.2 : 0;
  let num = 0;
  let den = 0;
  const gaps: string[] = [];
  for (const cap of CAPABILITIES) {
    const importance = card.capabilities[cap.code];
    if (!importance) continue;
    const own = profile.skills[cap.code] / 3;
    if (own < 0.67 && importance >= 2) gaps.push(cap.name.toLowerCase());
    num += importance * Math.min(1, own + (own < 1 ? coFounderCredit : 0));
    den += importance;
  }
  const capabilityMatch = den ? num / den : 0.5;
  const interestMatch = card.interest.some((i) => profile.interests.includes(i)) ? 1 : 0.3;
  const physical = card.physicalOps ? (profile.physicalOps === "no" ? 0.4 : profile.physicalOps === "maybe" ? 0.8 : 1) : 1;
  const time = card.needsFullTime && isPartTime(profile) ? 0.8 : 1;
  const raw = (0.65 * capabilityMatch + 0.35 * interestMatch) * physical * time;
  const parts = [`Skills match ${Math.round(capabilityMatch * 100)}%`, interestMatch === 1 ? "matches your interests" : "outside your stated interests"];
  if (gaps.length) parts.push(`gaps in ${gaps.join(", ")}`);
  if (physical < 1) parts.push("needs physical operations you are wary of");
  if (time < 1) parts.push("needs full-time presence");
  return { score: round1(clamp(1 + 4 * raw)), why: parts.join("; ") + "." };
}

export function knockouts(industry: Industry, profile: FounderProfile): Knockout[] {
  const out: Knockout[] = [];
  const card = industry.card;
  if (!card) return out;
  const need = capitalNeed(industry);
  if (need && profile.maxExposure && need.optimistic > profile.maxExposure) {
    out.push({ code: "capital", message: "Even the cheapest version needs more than your maximum exposure." });
  }
  if (card.regulatedProfession && !card.regulatedProfession.qualifications.some((q) => profile.qualifications.includes(q))) {
    out.push({ code: "licence", message: `Needs a ${card.regulatedProfession.role.toLowerCase()}. You would have to hire or partner with one.` });
  }
  if (card.needsFullTime && isPartTime(profile)) {
    out.push({ code: "time", message: "Needs full-time presence; you plan to be part-time." });
  }
  if (card.physicalOps && profile.physicalOps === "no") {
    out.push({ code: "physical", message: "Runs on daily physical operations, which you said you do not want." });
  }
  return out;
}

export function scoreIndustry(
  industry: Industry,
  profile: FounderProfile,
  weights: Weights,
  overrides: Readonly<Partial<Record<CriterionCode, ScoreOverride>>> = {},
): OpportunityScore {
  const card = industry.card;
  const fit = founderFit(industry, profile);
  const criteria: CriterionScore[] = CRITERIA.map((c) => {
    const o = overrides[c.code];
    if (o) {
      return { code: c.code, low: clamp(o.low), base: clamp(o.base), high: clamp(o.high), evidence: o.evidence, why: o.note || "Your score.", overridden: true };
    }
    if (c.code === "capital") return capitalCriterion(industry, profile);
    if (c.code === "fit") {
      return { code: "fit", low: round1(clamp(fit.score - 0.5)), base: fit.score, high: round1(clamp(fit.score + 0.5)), evidence: "user_input", why: fit.why, overridden: false };
    }
    const judged = card?.scores[c.code as JudgedCriterion];
    if (!judged) return { code: c.code, low: 1, base: 3, high: 5, evidence: "unknown", why: "Not researched yet. Score it yourself.", overridden: false };
    return { code: c.code, low: judged.low, base: judged.base, high: judged.high, evidence: "model_assumption", why: judged.why, overridden: false };
  });

  let total = 0;
  let lo = 0;
  let mid = 0;
  let hi = 0;
  let quality = 0;
  for (const s of criteria) {
    const w = Math.max(0, weights[s.code] ?? 0);
    total += w;
    lo += w * s.low;
    mid += w * s.base;
    hi += w * s.high;
    quality += w * EVIDENCE_QUALITY[s.evidence];
  }
  const avg = (x: number) => (total ? round1((x / total) * 20) : 60);
  return {
    industryId: industry.id,
    low: avg(lo),
    base: avg(mid),
    high: avg(hi),
    evidenceCoverage: total ? Math.round((quality / total) * 100) / 100 : 0,
    criteria,
    knockouts: knockouts(industry, profile),
    researched: card !== null,
  };
}

export interface Sensitivity {
  readonly top: string | null;
  readonly stable: boolean;
  /** Criteria whose weight moving by ±5 changes the top-ranked industry. */
  readonly sensitiveTo: readonly CriterionCode[];
}

/** Rank stability for a set of industries under ±5 weight perturbations (doc 04, 3.4). */
export function rankSensitivity(
  industries: readonly Industry[],
  profile: FounderProfile,
  weights: Weights,
  overrides: Readonly<Record<string, Partial<Record<CriterionCode, ScoreOverride>>>> = {},
): Sensitivity {
  if (industries.length < 2) return { top: industries[0]?.id ?? null, stable: true, sensitiveTo: [] };
  const topFor = (w: Weights) => {
    let best: { id: string; score: number } | null = null;
    for (const ind of industries) {
      const s = scoreIndustry(ind, profile, w, overrides[ind.id]).base;
      if (!best || s > best.score) best = { id: ind.id, score: s };
    }
    return best!.id;
  };
  const top = topFor(weights);
  const sensitiveTo: CriterionCode[] = [];
  for (const c of CRITERIA) {
    for (const delta of [-5, 5]) {
      const w = { ...weights, [c.code]: Math.max(0, weights[c.code] + delta) };
      if (topFor(w) !== top) {
        sensitiveTo.push(c.code);
        break;
      }
    }
  }
  return { top, stable: sensitiveTo.length === 0, sensitiveTo };
}

export { JUDGED_CRITERIA };
