/**
 * Founder Action Centre v1 for Stages 0 and 1 (blueprint doc 13).
 */
import { industryById, type Industry } from "./industries.js";
import { isProfileComplete, missingAnswers, profileFlags } from "./profile.js";
import { CRITERIA, scoreIndustry } from "./scoring.js";
import { stage, type GameState } from "./state.js";

export type Bucket =
  | "Do now"
  | "Before validation"
  | "Before launch"
  | "Before signing a contract"
  | "Before hiring"
  | "Before fundraising"
  | "Before expansion"
  | "Can defer";

export interface Components {
  readonly impact: number;
  readonly urgency: number;
  readonly unlock: number;
  readonly delayRisk: number;
  readonly evidenceValue: number;
}

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly why: string;
  readonly bucket: Bucket;
  readonly kind: "action" | "decision" | "learning" | "fieldwork";
  readonly priority: number;
  readonly components: Components;
  readonly cost: string;
  readonly time: string;
  readonly evidence: string;
  /** View to open, as a page hash. */
  readonly link: string;
  /** Always shown regardless of rank (doc 13, 5.1). */
  readonly pinned: boolean;
}

/** Priority formula from doc 13, section 5. Weights are model assumptions. */
export function priority(c: Components): number {
  return Math.round(0.3 * c.impact + 0.25 * c.urgency + 0.2 * c.unlock + 0.15 * c.delayRisk + 0.1 * c.evidenceValue);
}

type Draft = Omit<Task, "priority" | "pinned"> & { pinned?: boolean };
const make = (d: Draft): Task => ({ ...d, pinned: d.pinned ?? false, priority: priority(d.components) });

export function allTasks(g: GameState): Task[] {
  const tasks: Task[] = [];
  const p = g.profile;

  if (!isProfileComplete(p)) {
    const left = missingAnswers(p).length;
    tasks.push(make({
      id: "profile", kind: "action", bucket: "Do now", pinned: true,
      title: "Finish your founder profile",
      why: `${left} question${left === 1 ? "" : "s"} left. The Radar scores industries against your capital, skills and time, so it cannot judge fit without them.`,
      components: { impact: 80, urgency: 90, unlock: 100, delayRisk: 40, evidenceValue: 60 },
      cost: "₹0", time: "10 minutes", evidence: "All required answers given", link: "#profile",
    }));
    return tasks;
  }

  for (const f of profileFlags(p)) {
    if (f.code === "restriction" && !p.restrictionAcknowledged) {
      tasks.push(make({
        id: "restriction", kind: "action", bucket: "Do now", pinned: true,
        title: "Check what your contract or professional body allows",
        why: f.message,
        components: { impact: 90, urgency: 80, unlock: 40, delayRisk: 80, evidenceValue: 20 },
        cost: "₹0", time: "1 hour", evidence: "You have read the clause and noted what it allows", link: "#profile",
      }));
    }
    if (f.code === "exposure_above_capital") {
      tasks.push(make({
        id: "exposure", kind: "decision", bucket: "Do now",
        title: "Decide whether you would borrow to cover losses",
        why: f.message,
        components: { impact: 70, urgency: 60, unlock: 30, delayRisk: 40, evidenceValue: 20 },
        cost: "₹0", time: "15 minutes", evidence: "Maximum exposure confirmed or reduced", link: "#profile",
      }));
    }
  }

  if (g.shortlist.length === 0) {
    tasks.push(make({
      id: "shortlist", kind: "decision", bucket: "Do now",
      title: "Shortlist 1 to 4 industries in the Radar",
      why: "Comparing a few industries side by side is how you avoid falling for the first idea. Nothing else in Stage 1 can start until you have a shortlist.",
      components: { impact: 70, urgency: 60, unlock: 90, delayRisk: 30, evidenceValue: 50 },
      cost: "₹0", time: "20 minutes", evidence: "At least one industry shortlisted", link: "#radar",
    }));
  }

  if (!g.weightsEdited) {
    tasks.push(make({
      id: "weights", kind: "decision", bucket: "Before validation",
      title: "Set the scoring weights to match what you care about",
      why: "The default weights are a starting point. A founder who wants steady cash should weigh downside and capital more than scalability.",
      components: { impact: 45, urgency: 30, unlock: 30, delayRisk: 10, evidenceValue: 30 },
      cost: "₹0", time: "5 minutes", evidence: "Weights saved", link: "#radar",
    }));
  }

  for (const id of g.shortlist) {
    const ind = industryById(id);
    if (!ind) continue;
    const score = scoreIndustry(ind, p, g.weights, g.overrides[id]);

    for (const k of score.knockouts) {
      tasks.push(make({
        id: `knockout:${id}:${k.code}`, kind: "decision", bucket: "Before validation",
        title: `Resolve a red flag on ${ind.name}`,
        why: k.message,
        components: { impact: 75, urgency: 50, unlock: 60, delayRisk: 40, evidenceValue: 40 },
        cost: "₹0", time: "30 minutes", evidence: "A plan to close the gap, or the industry dropped", link: `#industry-${id}`,
      }));
    }

    if (!g.disconfirm[id]?.trim()) {
      tasks.push(make({
        id: `disconfirm:${id}`, kind: "action", bucket: "Before validation",
        title: `Write what would change your mind about ${ind.name}`,
        why: "Deciding in advance what evidence would kill the idea protects you from only seeing what you want to see.",
        components: { impact: 60, urgency: 50, unlock: 70, delayRisk: 20, evidenceValue: 70 },
        cost: "₹0", time: "10 minutes", evidence: "A specific, testable statement", link: `#industry-${id}`,
      }));
    }

    if (ind.card) {
      if (score.evidenceCoverage < 0.5) {
        const weakest = weakestCriterion(ind, g);
        tasks.push(make({
          id: `evidence:${id}`, kind: "fieldwork", bucket: "Before validation",
          title: `Firm up the weakest part of the ${ind.name} score`,
          why: `Only ${Math.round(score.evidenceCoverage * 100)}% of this score rests on solid evidence.${weakest ? ` "${weakest}" carries a lot of weight and is still an assumption.` : ""}`,
          components: { impact: 60, urgency: 35, unlock: 40, delayRisk: 20, evidenceValue: 90 },
          cost: "₹0", time: "1 to 3 days", evidence: "Criterion re-scored with field evidence", link: `#industry-${id}`,
        }));
      }
      const i = ind.card.fieldTasks.findIndex((_, n) => !g.fieldwork[`${id}:${n}`]);
      if (i >= 0) {
        const ft = ind.card.fieldTasks[i]!;
        tasks.push(make({
          id: `field:${id}:${i}`, kind: "fieldwork", bucket: "Before validation",
          title: `${ft.title} (${ind.name})`,
          why: `${ft.method}. This replaces a guess with something you observed.`,
          components: { impact: 55, urgency: 40, unlock: 50, delayRisk: 25, evidenceValue: 85 },
          cost: ft.cost, time: `${ft.days} day${ft.days === 1 ? "" : "s"}`, evidence: "What you found, written down", link: `#industry-${id}`,
        }));
      }
    }
  }

  const ready = g.shortlist.filter((id) => g.disconfirm[id]?.trim());
  if (stage(g) === 1 && ready.length > 0) {
    tasks.push(make({
      id: "lead", kind: "decision", bucket: "Before validation",
      title: "Choose the one industry to take into customer discovery",
      why: "Stage 2 is about finding a real customer problem. That needs focus on one industry; you can come back to the others if the evidence says so.",
      components: { impact: 70, urgency: 45, unlock: 90, delayRisk: 20, evidenceValue: 30 },
      cost: "₹0", time: "15 minutes", evidence: "Lead industry chosen, with your reasoning", link: "#compare",
    }));
  }

  if (!g.learned.includes("opportunity-score")) {
    tasks.push(make({
      id: "learn:opportunity-score", kind: "learning", bucket: "Can defer",
      title: "Learn how the opportunity score works (3 minutes)",
      why: "Knowing what drives the score stops you from treating it as an answer instead of a structured judgement.",
      components: { impact: 30, urgency: 20, unlock: 10, delayRisk: 0, evidenceValue: 20 },
      cost: "₹0", time: "3 minutes", evidence: "Concept card read", link: "#learn-opportunity-score",
    }));
  }

  // Done and rejected tasks drop out; deferred ones stay in the backlog only.
  return tasks.filter((t) => {
    const st = g.tasks[t.id]?.status;
    return st !== "done" && st !== "rejected";
  });
}

function weakestCriterion(ind: Industry, g: GameState): string | null {
  const score = scoreIndustry(ind, g.profile, g.weights, g.overrides[ind.id]);
  let best: { name: string; w: number } | null = null;
  for (const c of score.criteria) {
    if (c.evidence !== "model_assumption" && c.evidence !== "unknown") continue;
    const w = g.weights[c.code];
    if (!best || w > best.w) best = { name: CRITERIA.find((x) => x.code === c.code)!.name, w };
  }
  return best?.name ?? null;
}

/** The 3 to 7 actions to show now (doc 13, 5.1): pinned first, then by priority, max one learning task. */
export function nextActions(g: GameState, max = 7): Task[] {
  const all = allTasks(g).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.priority - a.priority);
  const out: Task[] = [];
  let learning = 0;
  let deferrable = 0;
  for (const t of all) {
    if (g.tasks[t.id]?.status === "deferred" && !t.pinned) continue;
    if (t.kind === "learning" && learning >= 1) continue;
    if (t.bucket === "Can defer" && deferrable >= 2) continue;
    out.push(t);
    if (t.kind === "learning") learning++;
    if (t.bucket === "Can defer") deferrable++;
    if (out.length >= max) break;
  }
  return out;
}

/** Tasks not shown in the top list, for the backlog view. */
export function backlog(g: GameState): Task[] {
  const shown = new Set(nextActions(g).map((t) => t.id));
  return allTasks(g).filter((t) => !shown.has(t.id)).sort((a, b) => b.priority - a.priority);
}
