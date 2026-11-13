import React, { useState } from "react";
import { chooseLead, CRITERIA, industryById, rankSensitivity, scoreIndustry, type Industry } from "@vfs/discovery";
import { useGame } from "../game";
import { Button, capitalLabel, Card, Chip, cx, inputClass, LinkButton, ScoreRange } from "../ui";

export function CompareView() {
  const { game, update, notify } = useGame();
  const [rationale, setRationale] = useState("");
  const [pick, setPick] = useState<string>(game.leadIndustry ?? "");
  const inds = game.shortlist.map((id) => industryById(id)).filter((x): x is Industry => !!x);

  if (inds.length === 0) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-[22px] font-semibold">Nothing shortlisted yet</h1>
        <p className="mt-2 text-[14px] text-muted">Pick 1 to 4 industries in the Radar, then compare them here side by side.</p>
        <div className="mt-5"><LinkButton href="#radar" variant="primary">Open the Opportunity Radar</LinkButton></div>
      </Card>
    );
  }

  const scores = inds.map((i) => scoreIndustry(i, game.profile, game.weights, game.overrides[i.id]));
  const sens = rankSensitivity(inds, game.profile, game.weights, game.overrides);
  const nameOf = (code: string) => CRITERIA.find((c) => c.code === code)!.name;
  const timeScore = (n: number) => scores[n]!.criteria.find((c) => c.code === "time")!.base;

  const rows: { label: string; cell(i: Industry, n: number): React.ReactNode }[] = [
    { label: "Score and range", cell: (_, n) => <ScoreRange low={scores[n]!.low} base={scores[n]!.base} high={scores[n]!.high} /> },
    { label: "Evidence coverage", cell: (_, n) => <span className={cx("figures font-semibold", scores[n]!.evidenceCoverage < 0.5 ? "text-warn" : "text-good")}>{Math.round(scores[n]!.evidenceCoverage * 100)}%</span> },
    { label: "Capital for a first unit", cell: (i) => (i.card ? capitalLabel(i.card.capital) : "Unknown") },
    { label: "Time to first revenue", cell: (_, n) => `${timeScore(n)} of 5` },
    { label: "Red flags", cell: (_, n) => (scores[n]!.knockouts.length ? <div className="space-y-1">{scores[n]!.knockouts.map((k) => <Chip key={k.code} tone="danger" title={k.message}>{k.message}</Chip>)}</div> : <span className="text-muted">None</span>) },
    { label: "What usually kills it", cell: (i) => (i.card ? <ul className="list-disc space-y-0.5 pl-4">{i.card.killers.map((k) => <li key={k}>{k}</li>)}</ul> : "Not researched") },
    { label: "Biggest unknowns", cell: (i) => (i.card ? <ul className="list-disc space-y-0.5 pl-4">{i.card.unknowns.map((k) => <li key={k}>{k}</li>)}</ul> : "Everything") },
    { label: "Fieldwork done", cell: (i) => (i.card ? `${i.card.fieldTasks.filter((_, n) => game.fieldwork[`${i.id}:${n}`]).length} of ${i.card.fieldTasks.length}` : "-") },
    { label: "What would change your mind", cell: (i) => game.disconfirm[i.id] ?? <a href={`#industry-${i.id}`} className="text-warn underline">Not written yet</a> },
  ];

  const lead = game.leadIndustry ? industryById(game.leadIndustry) : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow">Stage 1 · Industry discovery</div>
        <h1 className="mt-1 text-[26px] font-semibold">Compare your shortlist</h1>
      </div>

      {inds.length > 1 && (
        <div className={cx("rounded-lg border p-4 text-[14px]", sens.stable ? "border-line bg-surface-2" : "border-warn bg-warn-soft")}>
          {sens.stable
            ? `${industryById(sens.top!)!.name} ranks first, and stays first if any single weight moves by 5 points either way.`
            : `${industryById(sens.top!)!.name} ranks first, but the order flips if you move the weight on ${sens.sensitiveTo.map(nameOf).map((s) => s.toLowerCase()).join(", ")} by 5 points. The ranking is a judgement call, not a result.`}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left">
              <th className="w-44 px-4 py-3 text-[12px] font-medium text-muted" />
              {inds.map((i) => (
                <th key={i.id} className="px-4 py-3 align-bottom">
                  <a href={`#industry-${i.id}`} className="font-semibold text-ink hover:text-accent">{i.name}</a>
                  {game.leadIndustry === i.id && <div className="mt-1"><Chip tone="accent">Lead industry</Chip></div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line align-top last:border-b-0">
                <th className="px-4 py-3 text-left text-[13px] font-medium text-muted">{r.label}</th>
                {inds.map((i, n) => <td key={i.id} className="px-4 py-3">{r.cell(i, n)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">{lead ? `Your lead industry: ${lead.name}` : "Choose your lead industry"}</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-muted">
          Stage 2 needs focus on one industry to find a real customer problem. You can switch later if the evidence says so; the switch is recorded, not punished.
          Your reasoning is part of how your judgement is assessed: say why, and what you are least sure about.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
          <select id="lead-pick" className={inputClass} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Select an industry</option>
            {inds.map((i) => <option key={i.id} value={i.id} disabled={!game.disconfirm[i.id]}>{i.name}{game.disconfirm[i.id] ? "" : " (write what would change your mind first)"}</option>)}
          </select>
          <textarea id="lead-rationale" rows={3} className={inputClass} value={rationale} onChange={(e) => setRationale(e.target.value)}
            placeholder="e.g. Best founder fit and lowest capital; recurring revenue. Least sure about willingness to pay." />
        </div>
        <div className="mt-3">
          <Button variant="primary" disabled={!pick} onClick={() => {
            try {
              update((g) => chooseLead(g, pick, rationale));
              notify("Lead industry chosen. Stage 2 is unlocked.");
              setRationale("");
            } catch (e) {
              notify((e as Error).message);
            }
          }}>{lead ? "Change lead industry" : "Choose as lead industry"}</Button>
        </div>
      </Card>
    </div>
  );
}
