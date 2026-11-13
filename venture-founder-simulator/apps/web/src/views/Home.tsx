import React, { useState } from "react";
import { backlog, industryById, nextActions, stage, STAGE_NAMES, withDecision, type Task } from "@vfs/discovery";
import { useGame } from "../game";
import { Button, Card, Chip, cx, Explain, inputClass, LinkButton } from "../ui";

export function HomeView() {
  const { game } = useGame();
  const tasks = nextActions(game);
  const rest = backlog(game);
  const [showBacklog, setShowBacklog] = useState(false);
  const st = stage(game);
  const lead = game.leadIndustry ? industryById(game.leadIndustry) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div>
          <div className="eyebrow">Founder Action Centre</div>
          <h1 className="mt-1 text-[26px] font-semibold">
            {st === 0 ? "Start with you, not the business" : st === 1 ? "Find an industry worth testing" : `Next: find a real customer problem in ${lead?.name.toLowerCase()}`}
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            The most important things to do next, ranked by impact, urgency, what they unlock, the cost of delay and how much they reduce uncertainty. You decide what to do with each one.
          </p>
        </div>

        {st === 2 && (
          <div className="rounded-lg border border-accent bg-accent-soft p-4 text-[14px]">
            <div className="font-semibold">Stage 2 is unlocked</div>
            <p className="mt-1">Customer discovery (segments, interviews, jobs to be done, market sizing) arrives in the next build. Until then, keep doing fieldwork on your lead industry: every observation you record now feeds Stage 2.</p>
          </div>
        )}

        <ol className="space-y-3">
          {tasks.map((t, n) => <TaskCard key={t.id} task={t} rank={n + 1} />)}
          {tasks.length === 0 && <Card className="p-6 text-[14px] text-muted">Nothing urgent. Review your backlog or keep doing fieldwork.</Card>}
        </ol>

        {rest.length > 0 && (
          <div>
            <Button variant="ghost" onClick={() => setShowBacklog(!showBacklog)} aria-expanded={showBacklog}>
              {showBacklog ? "Hide" : "Show"} the full backlog ({rest.length})
            </Button>
            {showBacklog && <ul className="mt-2 space-y-2">{rest.map((t) => <li key={t.id}><TaskCard task={t} compact /></li>)}</ul>}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="eyebrow">Your journey</div>
          <ol className="mt-3 space-y-2 text-[13px]">
            {STAGE_NAMES.map((name, n) => (
              <li key={name} className="flex items-center gap-2">
                <span className={cx("figures flex h-5 w-5 items-center justify-center rounded-full text-[11px]", n < st ? "bg-accent text-accent-ink" : n === st ? "border-2 border-accent text-accent" : "bg-surface-2 text-muted")}>{n}</span>
                <span className={n === st ? "font-semibold" : n < st ? "" : "text-muted"}>{name}</span>
              </li>
            ))}
            {["Business model design", "Validation and pilots", "Formation and compliance", "Launch, operations and finance", "Funding, growth and exit"].map((name, n) => (
              <li key={name} className="flex items-center gap-2 text-muted">
                <span className="figures flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[11px]">{n + 3}</span>
                <span>{name}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-4 text-[13px]">
          <div className="eyebrow">How to use this</div>
          <p className="mt-2">Every number carries a label: <b>[A]</b> model assumption, <b>[U]</b> your input, <b>[F]</b> your field observation, <b>[3P]</b> third-party estimate, <b>[V]</b> verified fact.</p>
          <p className="mt-2">Replace assumptions with evidence and watch the ranges narrow. That is the skill this stage trains.</p>
          <div className="mt-2"><Explain term="evidence-class" label="More on evidence labels" /></div>
        </Card>
      </aside>
    </div>
  );
}

function TaskCard({ task: t, rank, compact = false }: { task: Task; rank?: number; compact?: boolean }) {
  const { update } = useGame();
  const [why, setWhy] = useState(false);
  const [closing, setClosing] = useState<"deferred" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const tone = t.bucket === "Do now" ? "danger" : t.bucket === "Can defer" ? "neutral" : "warn";
  const setStatus = (status: "deferred" | "rejected" | "done", r: string) =>
    update((g) => withDecision({ ...g, tasks: { ...g.tasks, [t.id]: { status, reason: r, at: new Date().toISOString() } } }, `Task${status[0]!.toUpperCase()}${status.slice(1)}`, t.id, r));

  return (
    <Card className={cx("p-4", compact && "p-3")}>
      <div className="flex flex-wrap items-start gap-3">
        {rank && <span className="figures mt-0.5 w-5 text-[13px] text-muted">{rank}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={tone}>{t.bucket}</Chip>
            <Chip>{t.kind === "decision" ? "Decision" : t.kind === "fieldwork" ? "Fieldwork" : t.kind === "learning" ? "Learning" : "Action"}</Chip>
            {t.pinned && <Chip tone="danger">Always shown</Chip>}
          </div>
          <h3 className="mt-1.5 text-[16px] font-semibold">{t.title}</h3>
          {!compact && <p className="mt-1 text-[14px] text-muted">{t.why}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>Cost: <b className="text-ink">{t.cost}</b></span>
            <span>Time: <b className="text-ink">{t.time}</b></span>
            <span>Done when: {t.evidence}</span>
          </div>
          {why && (
            <div className="figures mt-3 grid grid-cols-2 gap-x-6 gap-y-0.5 rounded bg-surface-2 p-3 text-[12px] sm:grid-cols-3">
              <span>Impact {t.components.impact}</span><span>Urgency {t.components.urgency}</span><span>Unlocks {t.components.unlock}</span>
              <span>Cost of delay {t.components.delayRisk}</span><span>Evidence value {t.components.evidenceValue}</span><span className="font-semibold">Priority {t.priority}</span>
              <span className="col-span-full mt-1 font-sans text-muted">Priority = 0.30 impact + 0.25 urgency + 0.20 unlocks + 0.15 cost of delay + 0.10 evidence value</span>
            </div>
          )}
          {closing && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input id={`reason-${t.id}`} className={cx(inputClass, "max-w-md flex-1")} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={closing === "rejected" ? "Why are you rejecting this? (recorded)" : "Why later? (recorded)"} />
              <Button size="sm" variant="primary" disabled={!reason.trim()} onClick={() => { setStatus(closing, reason.trim()); setClosing(null); }}>Confirm</Button>
              <Button size="sm" onClick={() => setClosing(null)}>Cancel</Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={t.link} variant="primary" size="sm">Open</LinkButton>
          {!t.pinned && !closing && (
            <>
              {t.kind === "learning" && <Button size="sm" onClick={() => setStatus("done", "Read")}>Mark read</Button>}
              <Button size="sm" onClick={() => setClosing("deferred")}>Defer</Button>
              <Button size="sm" variant="ghost" onClick={() => setClosing("rejected")}>Reject</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => setWhy(!why)} aria-expanded={why}>Why ranked here</Button>
        </div>
      </div>
    </Card>
  );
}
