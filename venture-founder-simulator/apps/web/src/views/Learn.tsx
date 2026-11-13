import React, { useEffect, useState } from "react";
import { GLOSSARY, termById } from "@vfs/learning";
import { useGame } from "../game";
import { Card, Chip, cx, inputClass } from "../ui";

const AREAS = ["Strategy", "Research", "Finance", "Cash", "Marketing", "Operations", "Tax and compliance"] as const;

export function LearnView({ termId }: { termId?: string }) {
  const { update } = useGame();
  const [q, setQ] = useState("");
  const open = termId ? termById(termId) : null;

  useEffect(() => {
    if (open) update((g) => (g.learned.includes(open.id) ? g : { ...g, learned: [...g.learned, open.id] }));
  }, [open, update]);

  if (open) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <a href="#learn" className="text-[13px] text-accent">← All terms</a>
        <Card className="p-6">
          <div className="eyebrow">{open.area}</div>
          <h1 className="mt-1 text-[26px] font-semibold">{open.term}</h1>
          <p className="mt-3 text-[16px]">{open.short}</p>
          {open.formula && <p className="figures mt-4 rounded bg-surface-2 p-3 text-[13px]">{open.formula}</p>}
          {[["Why it matters", open.why], ["Common mistakes", open.mistakes], ["What it helps you decide", open.informs]].map(([h, t]) => (
            <div key={h} className="mt-5"><div className="eyebrow">{h}</div><p className="mt-1 text-[15px]">{t}</p></div>
          ))}
        </Card>
        <p className="text-[12px] text-muted">Where this simulator has your own numbers, the same explanation appears beside them with your figures.</p>
      </div>
    );
  }

  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
  const terms = GLOSSARY.filter((t) => !q || match(t.term) || match(t.short));
  return (
    <div className="space-y-5">
      <div>
        <div className="eyebrow">Learning Centre</div>
        <h1 className="mt-1 text-[26px] font-semibold">Terms and concepts</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-muted">Short definitions first, formulas and common mistakes on demand. The list grows with each stage of the simulator.</p>
      </div>
      <input id="glossary-search" className={cx(inputClass, "max-w-md")} placeholder="Search terms" value={q} onChange={(e) => setQ(e.target.value)} />
      {AREAS.map((area) => {
        const list = terms.filter((t) => t.area === area);
        if (!list.length) return null;
        return (
          <section key={area}>
            <h2 className="text-[15px] font-semibold">{area}</h2>
            <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => (
                <a key={t.id} href={`#learn-${t.id}`} className="block rounded-lg border border-line bg-surface p-4 no-underline hover:border-accent">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-ink">{t.term}</span>
                    {t.formula && <Chip>Formula</Chip>}
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{t.short}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
