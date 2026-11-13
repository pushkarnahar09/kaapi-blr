import React, { useMemo, useState } from "react";
import {
  CRITERIA, defaultWeights, DEPTH_LABEL, FAMILIES, INDUSTRIES, isProfileComplete, MAX_SHORTLIST,
  scoreIndustry, toggleShortlist, withDecision, type FamilyCode, type Weights,
} from "@vfs/discovery";
import { useGame } from "../game";
import { Button, capitalLabel, Card, Chip, cx, Explain, LinkButton, ScoreRange } from "../ui";

export function RadarView() {
  const { game, update, notify } = useGame();
  const [family, setFamily] = useState<FamilyCode | "all">("all");
  const [researchedOnly, setResearchedOnly] = useState(true);
  const [showWeights, setShowWeights] = useState(false);

  const rows = useMemo(() => {
    return INDUSTRIES.filter((i) => (family === "all" || i.family === family) && (!researchedOnly || i.card))
      .map((i) => ({ ind: i, s: scoreIndustry(i, game.profile, game.weights, game.overrides[i.id]) }))
      .sort((a, b) => b.s.base - a.s.base);
  }, [family, researchedOnly, game.profile, game.weights, game.overrides]);

  const toggle = (id: string) => {
    try {
      update((g) => toggleShortlist(g, id));
    } catch (e) {
      notify((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow">Stage 1 · Industry discovery</div>
          <h1 className="mt-1 text-[26px] font-semibold">Opportunity Radar</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Every industry scored against your profile and your weights. Read each score as a range, and check how much of it rests on evidence.
            A large market does not make a good business.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowWeights((v) => !v)} aria-expanded={showWeights}>{showWeights ? "Hide weights" : "Edit weights"}</Button>
          <LinkButton href="#compare" variant="primary">Compare shortlist ({game.shortlist.length}/{MAX_SHORTLIST})</LinkButton>
        </div>
      </div>

      {!isProfileComplete(game.profile) && (
        <div className="rounded-lg border border-warn bg-warn-soft p-4 text-[14px]">
          Founder fit and capital scores need your profile. <a href="#profile" className="font-medium text-warn underline">Finish your profile</a> to make these scores about you.
        </div>
      )}

      {showWeights && <WeightsPanel />}

      <div className="flex flex-wrap items-center gap-2">
        <FamilyChip active={family === "all"} onClick={() => setFamily("all")}>All</FamilyChip>
        {(Object.keys(FAMILIES) as FamilyCode[]).map((f) => (
          <FamilyChip key={f} active={family === f} onClick={() => setFamily(f)} title={FAMILIES[f]}>{shortFamily(f)}</FamilyChip>
        ))}
        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
          <input id="researched-only" type="checkbox" checked={researchedOnly} onChange={(e) => setResearchedOnly(e.target.checked)} />
          Researched industries only
        </label>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)_90px_minmax(0,1.2fr)_120px] gap-4 border-b border-line bg-surface-2 px-4 py-2 text-[12px] font-medium text-muted md:grid">
          <span>Industry</span><span>Score and range</span><span>Evidence</span><span>Capital for a first unit</span><span />
        </div>
        <ul>
          {rows.map(({ ind, s }) => {
            const shortlisted = game.shortlist.includes(ind.id);
            const cap = ind.card ? ind.card.capital : null;
            return (
              <li key={ind.id} className="grid gap-3 border-b border-line px-4 py-3.5 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)_90px_minmax(0,1.2fr)_120px] md:items-center md:gap-4">
                <div className="min-w-0">
                  <a href={`#industry-${ind.id}`} className="font-medium text-ink hover:text-accent">{ind.name}</a>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Chip>{shortFamily(ind.family)}</Chip>
                    <Chip tone={ind.depth === "F" ? "accent" : "neutral"}>{DEPTH_LABEL[ind.depth]}</Chip>
                    {s.knockouts.map((k) => <Chip key={k.code} tone="danger" title={k.message}>Red flag: {k.code === "licence" ? "licence" : k.code}</Chip>)}
                  </div>
                </div>
                <ScoreRange low={s.low} base={s.base} high={s.high} dim={s.evidenceCoverage < 0.25} />
                <div className="text-[13px]">
                  <span className={cx("figures font-semibold", s.evidenceCoverage < 0.5 ? "text-warn" : "text-good")}>{Math.round(s.evidenceCoverage * 100)}%</span>
                  {s.evidenceCoverage < 0.5 && <span className="block text-[11px] text-muted">Hypothesis</span>}
                </div>
                <div className="text-[13px] text-muted">
                  {cap ? capitalLabel(cap) : "Unknown"}
                  {cap && <span className="block text-[11px]">Model assumption band</span>}
                </div>
                <div className="md:text-right">
                  <Button size="sm" variant={shortlisted ? "primary" : "secondary"} onClick={() => toggle(ind.id)} aria-pressed={shortlisted}>
                    {shortlisted ? "Shortlisted" : "Shortlist"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="text-[12px] text-muted">
        Scores for researched industries start as Claude's judgement (model assumptions), written to be challenged. Replace them with your own evidence on each industry's page.{" "}
        <Explain term="opportunity-score" label="How the score works" /> · <Explain term="evidence-coverage" label="What evidence coverage means" />
      </p>
    </div>
  );
}

function shortFamily(f: FamilyCode): string {
  return ({ A: "Food", B: "Beauty and wellness", C: "Healthcare", D: "Consumer", E: "Technology", F: "Local services", G: "Education and professional", H: "Climate and industrial" } as const)[f];
}

function FamilyChip({ active, onClick, children, title }: { active: boolean; onClick(): void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} aria-pressed={active}
      className={cx("cursor-pointer rounded-full border px-3 py-1 text-[13px]", active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-ink")}>
      {children}
    </button>
  );
}

function WeightsPanel() {
  const { game, update, notify } = useGame();
  const [w, setW] = useState<Weights>(game.weights);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold">What matters to you</h2>
        <span className="figures text-[12px] text-muted">Total weight {total} (only the proportions matter)</span>
      </div>
      <p className="mt-1 max-w-3xl text-[13px] text-muted">
        A founder who wants steady cash should weigh capital, downside and recurring revenue more. A founder chasing scale should weigh scalability and market more.
        Customer pain, willingness to pay and founder fit carry the most weight by default.
      </p>
      <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {CRITERIA.map((c) => (
          <div key={c.code}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`w-${c.code}`} className="text-[14px] font-medium">{c.name}</label>
              <span className="figures text-[13px]">{w[c.code]}</span>
            </div>
            <input id={`w-${c.code}`} type="range" min={0} max={20} value={w[c.code]} className="w-full" onChange={(e) => setW({ ...w, [c.code]: Number(e.target.value) })} />
            <div className="text-[12px] text-muted">{c.question}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => {
          update((g) => withDecision({ ...g, weights: w, weightsEdited: true }, "WeightsSet", JSON.stringify(w)));
          notify("Weights saved. Scores updated.");
        }}>Save weights</Button>
        <Button onClick={() => setW(defaultWeights())}>Back to defaults</Button>
      </div>
    </Card>
  );
}
