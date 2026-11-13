import React, { useState } from "react";
import {
  CAPABILITIES, isProfileComplete, profileFlags, QUALIFICATIONS, withDecision,
  type FounderProfile, type Interest, type SkillLevel,
} from "@vfs/discovery";
import { useGame } from "../game";
import { Button, Card, Chip, cx, Explain, inputClass, LinkButton, rupees } from "../ui";

type Patch = (p: Partial<FounderProfile>) => void;
interface Step {
  id: string;
  title: string;
  why: string;
  done(p: FounderProfile): boolean;
  render(p: FounderProfile, set: Patch): React.ReactNode;
}

function Choice<T extends string>({ value, options, onChange, multi = false }: { value: T | T[]; options: { v: T; label: string; sub?: string }[]; onChange(v: T | T[]): void; multi?: boolean }) {
  const selected = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  const toggle = (v: T) => {
    if (!multi) return onChange(v);
    const arr = value as T[];
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={selected(o.v)}
          onClick={() => toggle(o.v)}
          className={cx(
            "cursor-pointer rounded-md border px-3.5 py-2.5 text-left text-[14px] transition-colors",
            selected(o.v) ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
          )}
        >
          <span className="font-medium">{o.label}</span>
          {o.sub && <span className="mt-0.5 block text-[12px] text-muted">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function Money({ id, value, onChange, placeholder }: { id: string; value: number | null; onChange(v: number | null): void; placeholder: string }) {
  const [text, setText] = useState(value === null ? "" : value.toLocaleString("en-IN"));
  return (
    <div className="flex max-w-xs items-center gap-2">
      <span className="figures text-lg text-muted">₹</span>
      <input
        id={id}
        inputMode="numeric"
        className={cx(inputClass, "figures text-lg")}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          setText(digits ? Number(digits).toLocaleString("en-IN") : "");
          onChange(digits ? Number(digits) : null);
        }}
      />
    </div>
  );
}

const SKILL_LABELS = ["None", "Basic", "Working", "Strong", "Expert"];

const STEPS: Step[] = [
  {
    id: "purpose", title: "Why are you here right now?", why: "The simulator works the same either way, but it changes how we talk about real-world next steps.",
    done: (p) => !!p.purpose,
    render: (p, set) => <Choice value={p.purpose} onChange={(v) => set({ purpose: v as FounderProfile["purpose"] })} options={[
      { v: "learning", label: "To learn how businesses really work", sub: "Practise decisions before risking real money" },
      { v: "planning", label: "I am planning a real business", sub: "Use the simulator to test my thinking" },
    ]} />,
  },
  {
    id: "motivation", title: "Why do you want to build a business?", why: "Motivation shapes which trade-offs you will tolerate when things get hard. Pick all that apply.",
    done: (p) => p.motivation.length > 0,
    render: (p, set) => <Choice multi value={p.motivation} onChange={(v) => set({ motivation: v as string[] })} options={[
      "Build business judgement", "Financial independence", "Create something of my own", "Solve a problem I care about", "Higher income than a job", "Flexibility over my time",
    ].map((v) => ({ v, label: v }))} />,
  },
  {
    id: "success", title: "What would success look like in 3 years?", why: "A steady, profitable business and a venture-funded one need very different choices from day one.",
    done: (p) => p.successIn3Years.length > 0,
    render: (p, set) => <Choice multi value={p.successIn3Years} onChange={(v) => set({ successIn3Years: v as string[] })} options={[
      "A steady income from the business", "Independence from employment", "A business that keeps growing", "Impact on a problem I care about", "A business I could sell",
    ].map((v) => ({ v, label: v }))} />,
  },
  {
    id: "background", title: "What have you done professionally?", why: "Industries you know from the inside are where your judgement is sharpest. Optional, but it helps.",
    done: () => true,
    render: (p, set) => <textarea id="background" rows={4} className={inputClass} placeholder="e.g. 6 years in audit and FP&A, mostly with manufacturing and consumer clients" value={p.background} onChange={(e) => set({ background: e.target.value })} />,
  },
  {
    id: "qualifications", title: "Do you hold any professional qualifications?", why: "Some businesses legally need a qualified professional. Some qualifications also come with rules about running other businesses.",
    done: () => true,
    render: (p, set) => <Choice multi value={p.qualifications} onChange={(v) => set({ qualifications: v as FounderProfile["qualifications"] })} options={QUALIFICATIONS.map((q) => ({ v: q, label: q }))} />,
  },
  {
    id: "skills", title: "Rate yourself honestly on each capability", why: "This becomes your capability matrix. Overrating yourself only hides the gaps a co-founder or hire should fill.",
    done: () => true,
    render: (p, set) => (
      <div className="space-y-4">
        {CAPABILITIES.map((c) => (
          <div key={c.code}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`skill-${c.code}`} className="text-[14px] font-medium">{c.name}</label>
              <span className="text-[13px] text-muted">{SKILL_LABELS[p.skills[c.code]]}</span>
            </div>
            <input id={`skill-${c.code}`} type="range" min={0} max={4} step={1} className="mt-1 w-full" value={p.skills[c.code]}
              onChange={(e) => set({ skills: { ...p.skills, [c.code]: Number(e.target.value) as SkillLevel } })} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "hours", title: "How many hours a week can you give this for the next 6 months?", why: "Many physical businesses need a founder on site every day. Under 35 hours counts as part-time here.",
    done: (p) => p.hoursPerWeek !== null,
    render: (p, set) => (
      <div className="flex max-w-xs items-center gap-2">
        <input id="hours" inputMode="numeric" className={cx(inputClass, "figures text-lg")} placeholder="e.g. 15" value={p.hoursPerWeek ?? ""}
          onChange={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); set({ hoursPerWeek: d ? Math.min(100, Number(d)) : null }); }} />
        <span className="text-muted">hours a week</span>
      </div>
    ),
  },
  {
    id: "capital", title: "How much personal capital could you put in?", why: "Savings you could commit to a business, not your whole net worth.",
    done: (p) => p.personalCapital !== null,
    render: (p, set) => <Money id="capital" value={p.personalCapital} placeholder="e.g. 20,00,000" onChange={(v) => set({ personalCapital: v })} />,
  },
  {
    id: "exposure", title: "How much could you lose completely without changing your life plans?", why: "This becomes your maximum exposure. The simulator warns you before any decision pushes past it.",
    done: (p) => p.maxExposure !== null,
    render: (p, set) => (
      <div className="space-y-3">
        <Money id="exposure" value={p.maxExposure} placeholder="e.g. 8,00,000" onChange={(v) => set({ maxExposure: v })} />
        <Explain term="max-exposure" label="How should I think about this?" />
      </div>
    ),
  },
  {
    id: "risk", title: "If your income were uncertain for 12 to 18 months, how would you feel?", why: "Most new businesses take longer than planned to pay the founder.",
    done: (p) => p.riskTolerance !== null,
    render: (p, set) => <Choice value={p.riskTolerance ? String(p.riskTolerance) : ""} onChange={(v) => set({ riskTolerance: Number(v) as FounderProfile["riskTolerance"] })} options={[
      { v: "1", label: "I could not cope with that" }, { v: "2", label: "Very uncomfortable" }, { v: "3", label: "Uncomfortable but manageable" },
      { v: "4", label: "Fine, I have planned for it" }, { v: "5", label: "Comfortable, it is part of the deal" },
    ]} />,
  },
  {
    id: "ops", title: "Do you want to manage people and physical operations day to day?", why: "Shifts, stock, premises and staff are a different life from a laptop business.",
    done: (p) => !!p.physicalOps,
    render: (p, set) => <Choice value={p.physicalOps} onChange={(v) => set({ physicalOps: v as FounderProfile["physicalOps"] })} options={[
      { v: "yes", label: "Yes, I would enjoy that" }, { v: "maybe", label: "Maybe, with a good manager" }, { v: "no", label: "No, I would rather not" },
    ]} />,
  },
  {
    id: "interests", title: "What kind of business excites you?", why: "Interest keeps you going through the boring and painful parts. Pick all that apply.",
    done: (p) => p.interests.length > 0,
    render: (p, set) => <Choice multi value={p.interests} onChange={(v) => set({ interests: v as Interest[] })} options={[
      { v: "tech", label: "Technology and software" }, { v: "consumer", label: "Consumer brands and products" }, { v: "services", label: "Services for people or businesses" },
    ]} />,
  },
  {
    id: "cofounder", title: "Do you want a co-founder?", why: "A co-founder can cover your skill gaps, at the cost of shared control and equity.",
    done: (p) => !!p.coFounder,
    render: (p, set) => (
      <div className="space-y-3">
        <Choice value={p.coFounder} onChange={(v) => set({ coFounder: v as FounderProfile["coFounder"] })} options={[
          { v: "yes", label: "Yes, I want one" }, { v: "open", label: "Open to it" }, { v: "no", label: "I prefer to go alone" },
        ]} />
        {p.coFounder !== "no" && p.coFounder && (
          <input id="cofounder-strength" className={inputClass} placeholder="What should they be strong at? (optional)" value={p.coFounderStrength} onChange={(e) => set({ coFounderStrength: e.target.value })} />
        )}
      </div>
    ),
  },
  {
    id: "location", title: "Where in Bengaluru could you operate?", why: "Location-based businesses depend heavily on locality. Optional.",
    done: () => true,
    render: (p, set) => <input id="location" className={inputClass} placeholder="e.g. Anywhere; or HSR Layout, Koramangala, Indiranagar" value={p.location} onChange={(e) => set({ location: e.target.value })} />,
  },
  {
    id: "outcome", title: "Steady cash or rapid growth?", why: "A business that pays you steadily rarely suits venture capital, and a venture-scale one rarely pays you early.",
    done: (p) => !!p.outcome,
    render: (p, set) => <Choice value={p.outcome} onChange={(v) => set({ outcome: v as FounderProfile["outcome"] })} options={[
      { v: "cash", label: "A business that pays me steadily", sub: "Owner-operated, profitable, self-funded or bank-funded" },
      { v: "venture", label: "Rapid growth with outside investors", sub: "Venture-scale, dilution, high risk" },
      { v: "undecided", label: "Not sure yet" },
    ]} />,
  },
  {
    id: "restrictions", title: "Does any contract or professional body restrict what you can do?", why: "Employment contracts, non-competes and professional rules can limit outside business. Check them; never work around them.",
    done: (p) => !!p.restrictions,
    render: (p, set) => (
      <div className="space-y-3">
        <Choice value={p.restrictions} onChange={(v) => set({ restrictions: v as FounderProfile["restrictions"] })} options={[
          { v: "no", label: "No" }, { v: "yes", label: "Yes" }, { v: "unsure", label: "Not sure" },
        ]} />
        {p.restrictions && p.restrictions !== "no" && (
          <input id="restriction-note" className={inputClass} placeholder="What do you know about it? (optional)" value={p.restrictionNote} onChange={(e) => set({ restrictionNote: e.target.value })} />
        )}
      </div>
    ),
  },
  {
    id: "exit", title: "When, if ever, would you want to exit?", why: "Exit plans change how you build: a business to sell needs clean books and a team that runs without you.",
    done: (p) => !!p.exitHorizon,
    render: (p, set) => <Choice value={p.exitHorizon} onChange={(v) => set({ exitHorizon: v as FounderProfile["exitHorizon"] })} options={[
      { v: "never", label: "Never, I want to keep it" }, { v: "5-10", label: "In 5 to 10 years" }, { v: "3-5", label: "In 3 to 5 years" }, { v: "undecided", label: "Undecided" },
    ]} />,
  },
];

export function ProfileView() {
  const { game, update } = useGame();
  const p = game.profile;
  const complete = isProfileComplete(p);
  const [editing, setEditing] = useState(!complete);
  const firstOpen = Math.max(0, STEPS.findIndex((s) => !s.done(p)));
  const [i, setI] = useState(complete ? 0 : firstOpen);
  const set: Patch = (patch) => update((g) => ({ ...g, profile: { ...g.profile, ...patch } }));

  if (!editing && complete) return <ProfileSummary onEdit={() => { setI(0); setEditing(true); }} />;

  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="eyebrow">Stage 0 · Founder discovery</div>
        <div className="figures text-[12px] text-muted">Question {i + 1} of {STEPS.length}</div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-2"><div className="h-1 rounded-full bg-accent" style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
      <Card className="mt-6 p-6 sm:p-8">
        <h1 className="text-[22px] font-semibold leading-tight sm:text-[26px]">{step.title}</h1>
        <p className="mt-2 text-[14px] text-muted">{step.why}</p>
        <div className="mt-6">{step.render(p, set)}</div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Back</Button>
          <div className="flex gap-2">
            {complete && <Button variant="ghost" onClick={() => setEditing(false)}>See summary</Button>}
            <Button
              variant="primary"
              disabled={!step.done(p)}
              onClick={() => {
                if (!last) return setI(i + 1);
                update((g) => withDecision(g, "ProfileCompleted", "Founder profile saved"));
                setEditing(false);
              }}
            >
              {last ? "Save my profile" : "Continue"}
            </Button>
          </div>
        </div>
      </Card>
      <p className="mt-4 text-center text-[12px] text-muted">Answers save as you go. Nothing here names a company or picks a menu: the first job is to understand you.</p>
    </div>
  );
}

function ProfileSummary({ onEdit }: { onEdit(): void }) {
  const { game, update } = useGame();
  const p = game.profile;
  const flags = profileFlags(p);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Stage 0 complete</div>
          <h1 className="mt-1 text-[26px] font-semibold">Your founder profile</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit}>Edit answers</Button>
          <LinkButton href="#radar" variant="primary">Open the Opportunity Radar</LinkButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Time", p.hoursPerWeek !== null ? `${p.hoursPerWeek} hrs/week` : "Not set", p.hoursPerWeek !== null && p.hoursPerWeek < 35 ? "Part-time" : "Full-time"],
          ["Capital you could commit", rupees(p.personalCapital), "Your input"],
          ["Maximum exposure", rupees(p.maxExposure), "The most you can afford to lose"],
          ["Outcome", p.outcome === "cash" ? "Steady cash" : p.outcome === "venture" ? "Venture growth" : "Undecided", `Risk tolerance ${p.riskTolerance ?? "-"} of 5`],
        ].map(([label, value, sub]) => (
          <Card key={label} className="p-4">
            <div className="eyebrow">{label}</div>
            <div className="figures mt-1 text-[19px] font-semibold">{value}</div>
            <div className="mt-0.5 text-[12px] text-muted">{sub}</div>
          </Card>
        ))}
      </div>

      {flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.code} className={cx("rounded-lg border p-4 text-[14px]", f.severity === "warning" ? "border-warn bg-warn-soft" : "border-line bg-surface-2")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-3xl">{f.message}</p>
                {f.code === "restriction" && (
                  p.restrictionAcknowledged
                    ? <Chip tone="good">Checked</Chip>
                    : <Button size="sm" onClick={() => update((g) => withDecision({ ...g, profile: { ...g.profile, restrictionAcknowledged: true } }, "RestrictionChecked", "Read the restriction terms"))}>I have checked the terms</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-semibold">Capability matrix</h2>
          <Explain term="founder-fit" label="How this feeds founder fit" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead>
              <tr className="text-left text-muted"><th className="pb-2 font-medium">Capability</th><th className="pb-2 font-medium">Your level</th><th className="pb-2 font-medium">How to cover a gap</th></tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => {
                const lvl = p.skills[c.code];
                const plan = lvl >= 3 ? "Strength" : lvl === 2 ? "Learn more, or use an advisor" : p.coFounder !== "no" ? "Co-founder or early hire" : "Hire, advisor or vendor";
                return (
                  <tr key={c.code} className="border-t border-line">
                    <td className="py-2.5 pr-4">{c.name}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5" aria-label={`${lvl} of 4`}>{[1, 2, 3, 4].map((n) => <span key={n} className={cx("h-2.5 w-5 rounded-sm", n <= lvl ? "bg-accent" : "bg-surface-2")} />)}</div>
                        <span className="text-[12px] text-muted">{SKILL_LABELS[lvl]}</span>
                      </div>
                    </td>
                    <td className="py-2.5"><Chip tone={lvl >= 3 ? "good" : "neutral"}>{plan}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-muted">Self-assessed (your input). Ask a former manager or colleague to rate you too; the gap between the two is often the most useful number here.</p>
      </Card>
    </div>
  );
}
