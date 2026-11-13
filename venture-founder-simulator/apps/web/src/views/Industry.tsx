import React, { useState } from "react";
import {
  CRITERIA, DEPTH_LABEL, EVIDENCE_LABEL, FAMILIES, industryById, scoreIndustry, toggleShortlist, withDecision,
  type CriterionCode, type EvidenceClass, type ScoreOverride,
} from "@vfs/discovery";
import { explainScore } from "@vfs/learning";
import { useGame } from "../game";
import { Button, capitalLabel, Card, Chip, cx, Evidence, Explain, inputClass, ScoreRange } from "../ui";

export function IndustryView({ id }: { id: string }) {
  const { game, update, notify } = useGame();
  const ind = industryById(id);
  const [editing, setEditing] = useState<CriterionCode | null>(null);
  const [disconfirm, setDisconfirm] = useState(game.disconfirm[id] ?? "");
  if (!ind) return <p>That industry does not exist. <a href="#radar" className="text-accent underline">Back to the Radar</a></p>;

  const score = scoreIndustry(ind, game.profile, game.weights, game.overrides[id]);
  const shortlisted = game.shortlist.includes(id);
  const card = ind.card;
  const drivers = score.criteria
    .map((c) => ({ name: CRITERIA.find((x) => x.code === c.code)!.name, score: c.base, weight: game.weights[c.code] }))
    .sort((a, b) => b.score * b.weight - a.score * a.weight);
  const lines = explainScore({ industryName: ind.name, base: score.base, low: score.low, high: score.high, evidenceCoverage: score.evidenceCoverage, drivers, knockouts: score.knockouts.map((k) => k.message) });

  const saveOverride = (code: CriterionCode, o: ScoreOverride | null) => {
    update((g) => {
      const mine = { ...(g.overrides[id] ?? {}) };
      if (o) mine[code] = o;
      else delete mine[code];
      return withDecision({ ...g, overrides: { ...g.overrides, [id]: mine } }, o ? "CriterionRescored" : "CriterionReset", `${id}.${code}`, o?.note ?? "");
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <a href="#radar" className="text-[13px] text-accent">← Opportunity Radar</a>
          <h1 className="mt-1 text-[26px] font-semibold">{ind.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip>{FAMILIES[ind.family]}</Chip>
            <Chip tone={ind.depth === "F" ? "accent" : "neutral"}>{DEPTH_LABEL[ind.depth]}</Chip>
          </div>
        </div>
        <Button variant={shortlisted ? "primary" : "secondary"} onClick={() => { try { update((g) => toggleShortlist(g, id)); } catch (e) { notify((e as Error).message); } }}>
          {shortlisted ? "Shortlisted" : "Add to shortlist"}
        </Button>
      </div>

      {!card && (
        <div className="rounded-lg border border-line bg-surface-2 p-4 text-[14px]">
          No research card yet for this industry. Every criterion starts as unknown (score 1 to 5, centred on 3). Score it yourself below, labelling what your scores rest on.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="p-5">
          <div className="eyebrow">Opportunity score on your weights</div>
          <div className="mt-3"><ScoreRange low={score.low} base={score.base} high={score.high} /></div>
          <div className="mt-4 space-y-1.5 text-[14px]">{lines.map((l, i) => <p key={i}>{l}</p>)}</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Explain term="opportunity-score" context={lines} label="Explain this score" />
            <Explain term="evidence-coverage" context={[`Evidence coverage for ${ind.name}: ${Math.round(score.evidenceCoverage * 100)}%.`]} label="Explain evidence coverage" />
          </div>
        </Card>
        <Card className="p-5">
          {card ? (
            <>
              <div className="eyebrow">What this business is</div>
              <p className="mt-1.5 text-[14px]">{card.summary}</p>
              <div className="eyebrow mt-4">Capital for a first unit</div>
              <p className="figures mt-1 text-[15px] font-semibold">{capitalLabel(card.capital)}</p>
              <p className="text-[12px] text-muted">Model assumption band. Quotations replace it.</p>
              <div className="eyebrow mt-4">Bengaluru</div>
              <p className="mt-1 text-[14px]">{card.bengaluru}</p>
            </>
          ) : (
            <p className="text-[14px] text-muted">Research for this industry has not been written. Use the field-research approach from researched industries: count, ask, quote, observe.</p>
          )}
        </Card>
      </div>

      {score.knockouts.length > 0 && (
        <div className="rounded-lg border border-danger bg-danger-soft p-4 text-[14px]">
          <div className="font-semibold text-danger">Red flags</div>
          <ul className="mt-1 list-disc pl-5">{score.knockouts.map((k) => <li key={k.code}>{k.message}</li>)}</ul>
          <div className="mt-2"><Explain term="knockout" label="What to do about a red flag" /></div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="text-[17px] font-semibold">The 13 criteria</h2>
          <span className="text-[12px] text-muted">5 is always the more attractive end · low / base / high</span>
        </div>
        <ul>
          {score.criteria.map((c) => {
            const info = CRITERIA.find((x) => x.code === c.code)!;
            const derived = (c.code === "capital" || c.code === "fit") && !c.overridden;
            return (
              <li key={c.code} className="border-b border-line px-5 py-3.5 last:border-b-0">
                <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_110px_minmax(0,2.4fr)_170px] md:items-start md:gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{info.name}</div>
                    <div className="text-[12px] text-muted">Weight {game.weights[c.code]}</div>
                  </div>
                  <div className="figures text-[15px]">
                    <span className="text-muted">{fmt(c.low)}</span> / <span className="font-semibold">{fmt(c.base)}</span> / <span className="text-muted">{fmt(c.high)}</span>
                  </div>
                  <div className="min-w-0 text-[14px]">
                    <div className="mb-1"><Evidence cls={c.evidence} full /></div>
                    {c.why}
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    {!derived && <Button size="sm" onClick={() => setEditing(editing === c.code ? null : c.code)}>{c.overridden ? "Edit my score" : "Re-score"}</Button>}
                    {c.overridden && <Button size="sm" variant="ghost" onClick={() => saveOverride(c.code, null)}>Reset</Button>}
                  </div>
                </div>
                {editing === c.code && <RescoreForm initial={c} onSave={(o) => saveOverride(c.code, o)} onCancel={() => setEditing(null)} />}
              </li>
            );
          })}
        </ul>
      </Card>

      {card && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-[17px] font-semibold">Field research</h2>
            <p className="mt-1 text-[13px] text-muted">Each task replaces a guess with something you observed. Record what you found; then re-score the criterion it affects and label it as your field observation.</p>
            <ul className="mt-3 space-y-3">
              {card.fieldTasks.map((ft, n) => <FieldTaskRow key={n} industryId={id} index={n} title={ft.title} method={ft.method} cost={ft.cost} days={ft.days} />)}
            </ul>
          </Card>
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">Still unknown</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">{card.unknowns.map((u) => <li key={u}>{u}</li>)}</ul>
            </Card>
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">What usually kills businesses here</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">{card.killers.map((u) => <li key={u}>{u}</li>)}</ul>
            </Card>
          </div>
        </div>
      )}

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">What would change your mind?</h2>
        <p className="mt-1 text-[13px] text-muted">Write a specific result that would make you drop this industry, before you look for evidence. Required before it can become your lead industry.</p>
        <textarea id={`disconfirm-${id}`} rows={3} className={cx(inputClass, "mt-3")} value={disconfirm} onChange={(e) => setDisconfirm(e.target.value)}
          placeholder="e.g. If fewer than 3 of 10 cafe owners I interview say they would pay ₹2,000 a month for this, I drop it." />
        <div className="mt-3 flex items-center gap-3">
          <Button variant="primary" disabled={!disconfirm.trim() || disconfirm === (game.disconfirm[id] ?? "")}
            onClick={() => { update((g) => withDecision({ ...g, disconfirm: { ...g.disconfirm, [id]: disconfirm.trim() } }, "DisconfirmingTestSet", id, disconfirm.trim())); notify("Saved."); }}>
            Save
          </Button>
          {game.disconfirm[id] && <Chip tone="good">Saved</Chip>}
        </div>
      </Card>
    </div>
  );
}

const fmt = (v: number) => String(Math.round(v * 10) / 10);

const EVIDENCE_OPTIONS: EvidenceClass[] = ["field_observation", "user_input", "third_party_estimate", "verified_fact", "model_assumption"];

function RescoreForm({ initial, onSave, onCancel }: { initial: { low: number; base: number; high: number; evidence: EvidenceClass }; onSave(o: ScoreOverride): void; onCancel(): void }) {
  const [low, setLow] = useState(Math.round(initial.low));
  const [base, setBase] = useState(Math.round(initial.base));
  const [high, setHigh] = useState(Math.round(initial.high));
  const [evidence, setEvidence] = useState<EvidenceClass>(initial.evidence === "model_assumption" || initial.evidence === "unknown" ? "user_input" : initial.evidence);
  const [note, setNote] = useState("");
  const valid = low <= base && base <= high && note.trim().length > 0;
  const sel = (id: string, v: number, set: (n: number) => void, label: string) => (
    <label className="text-[13px]" htmlFor={id}>{label}
      <select id={id} className={cx(inputClass, "mt-1 figures")} value={v} onChange={(e) => set(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
    </label>
  );
  return (
    <div className="mt-3 rounded-md border border-line bg-surface-2 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {sel("rs-low", low, setLow, "Low")}{sel("rs-base", base, setBase, "Base")}{sel("rs-high", high, setHigh, "High")}
        <label className="text-[13px]" htmlFor="rs-ev">What it rests on
          <select id="rs-ev" className={cx(inputClass, "mt-1")} value={evidence} onChange={(e) => setEvidence(e.target.value as EvidenceClass)}>
            {EVIDENCE_OPTIONS.map((e) => <option key={e} value={e}>{EVIDENCE_LABEL[e]}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[13px]" htmlFor="rs-note">Why (your evidence or reasoning)
        <input id="rs-note" className={cx(inputClass, "mt-1")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Counted 3 cafes within 500 m of the site on 2 evenings" />
      </label>
      {low > base || base > high ? <p className="mt-2 text-[12px] text-danger">Low must not exceed base, and base must not exceed high.</p> : null}
      <p className="mt-2 text-[12px] text-muted">Only choose "Your field observation" for something you saw or counted yourself.</p>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" disabled={!valid} onClick={() => onSave({ low, base, high, evidence, note: note.trim() })}>Save my score</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function FieldTaskRow({ industryId, index, title, method, cost, days }: { industryId: string; index: number; title: string; method: string; cost: string; days: number }) {
  const { game, update } = useGame();
  const key = `${industryId}:${index}`;
  const done = game.fieldwork[key];
  const [note, setNote] = useState(done?.note ?? "");
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-md border border-line p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-[13px] text-muted">{method}</div>
          <div className="mt-1 flex flex-wrap gap-1.5"><Chip>{cost}</Chip><Chip>{days} day{days === 1 ? "" : "s"}</Chip>{done && <Chip tone="good">Done</Chip>}</div>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>{done ? "View findings" : "Record findings"}</Button>
      </div>
      {open && (
        <div className="mt-3">
          <textarea id={`ft-${key}`} rows={3} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you find? Numbers, dates, places." />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" disabled={!note.trim()} onClick={() => {
              update((g) => withDecision({ ...g, fieldwork: { ...g.fieldwork, [key]: { note: note.trim(), at: new Date().toISOString() } } }, "FieldworkRecorded", key, note.trim()));
              setOpen(false);
            }}>Save findings</Button>
          </div>
        </div>
      )}
    </li>
  );
}
