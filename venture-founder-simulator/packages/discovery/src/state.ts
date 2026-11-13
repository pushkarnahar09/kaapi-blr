/**
 * The saved game for Stages 0 and 1, plus pure update helpers.
 * Plain JSON only, so it can be saved to storage and exported as a file.
 */
import { industryById } from "./industries.js";
import { emptyProfile, isProfileComplete, type FounderProfile } from "./profile.js";
import { defaultWeights, type CriterionCode, type ScoreOverride, type Weights } from "./scoring.js";

export const SIM_START_DATE = "2026-11-13";
export const MAX_SHORTLIST = 4;

export interface DecisionRecord {
  /** Real-world time the decision was made. */
  readonly at: string;
  readonly simDate: string;
  readonly type: string;
  readonly detail: string;
  readonly rationale: string;
}

export interface TaskStatus {
  readonly status: "done" | "deferred" | "rejected";
  readonly reason: string;
  readonly at: string;
}

export interface GameState {
  readonly version: 1;
  readonly simDate: string;
  readonly profile: FounderProfile;
  readonly weights: Weights;
  readonly weightsEdited: boolean;
  readonly shortlist: readonly string[];
  /** "What would change my mind" per industry. Required before an industry can lead. */
  readonly disconfirm: Readonly<Record<string, string>>;
  readonly overrides: Readonly<Record<string, Partial<Record<CriterionCode, ScoreOverride>>>>;
  /** Field tasks marked done, keyed "industryId:index", with what was found. */
  readonly fieldwork: Readonly<Record<string, { readonly note: string; readonly at: string }>>;
  readonly tasks: Readonly<Record<string, TaskStatus>>;
  readonly leadIndustry: string | null;
  readonly learned: readonly string[];
  readonly decisions: readonly DecisionRecord[];
}

export function newGame(): GameState {
  return {
    version: 1,
    simDate: SIM_START_DATE,
    profile: emptyProfile(),
    weights: defaultWeights(),
    weightsEdited: false,
    shortlist: [],
    disconfirm: {},
    overrides: {},
    fieldwork: {},
    tasks: {},
    leadIndustry: null,
    learned: [],
    decisions: [],
  };
}

/** Accept a saved or imported game, filling any fields added since it was saved. Throws on junk. */
export function loadGame(raw: unknown): GameState {
  if (!raw || typeof raw !== "object") throw new Error("This is not a saved game.");
  const g = raw as Partial<GameState>;
  if (g.version !== 1) throw new Error("This save comes from a different version of the simulator.");
  const fresh = newGame();
  return {
    ...fresh,
    ...g,
    profile: { ...fresh.profile, ...(g.profile ?? {}), skills: { ...fresh.profile.skills, ...(g.profile?.skills ?? {}) } },
    weights: { ...fresh.weights, ...(g.weights ?? {}) },
    shortlist: (g.shortlist ?? []).filter((id) => industryById(id)),
  } as GameState;
}

export function stage(g: GameState): 0 | 1 | 2 {
  if (!isProfileComplete(g.profile)) return 0;
  return g.leadIndustry ? 2 : 1;
}

export const STAGE_NAMES = [
  "Founder discovery",
  "Industry discovery",
  "Customer problem and market research",
] as const;

const now = () => new Date().toISOString();

export function withDecision(g: GameState, type: string, detail: string, rationale = ""): GameState {
  return { ...g, decisions: [...g.decisions, { at: now(), simDate: g.simDate, type, detail, rationale }] };
}

export function toggleShortlist(g: GameState, id: string): GameState {
  if (g.shortlist.includes(id)) {
    const next = { ...g, shortlist: g.shortlist.filter((x) => x !== id), leadIndustry: g.leadIndustry === id ? null : g.leadIndustry };
    return withDecision(next, "ShortlistRemoved", id);
  }
  if (g.shortlist.length >= MAX_SHORTLIST) throw new Error(`You can shortlist up to ${MAX_SHORTLIST} industries. Remove one first.`);
  return withDecision({ ...g, shortlist: [...g.shortlist, id] }, "ShortlistAdded", id);
}

export function chooseLead(g: GameState, id: string, rationale: string): GameState {
  if (!g.shortlist.includes(id)) throw new Error("Shortlist the industry before choosing it as your lead.");
  if (!g.disconfirm[id]?.trim()) throw new Error("Write what would change your mind about this industry first.");
  if (rationale.trim().length < 20) throw new Error("Give your reasoning in at least a sentence. It is part of how your judgement is assessed.");
  return withDecision({ ...g, leadIndustry: id }, "LeadIndustryChosen", id, rationale);
}
