import React, { useEffect } from "react";
import { capitalRangeLabel, EVIDENCE_LABEL, type CapitalBand, type EvidenceClass } from "@vfs/discovery";
import { termById } from "@vfs/learning";
import { useGame } from "./game";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-sm",
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-accent hover:bg-accent-soft",
        variant === "danger" && "border border-danger text-danger hover:bg-danger-soft",
        className,
      )}
    />
  );
}

export function LinkButton({ href, children, variant = "secondary", size = "md" }: { href: string; children: React.ReactNode; variant?: BtnProps["variant"]; size?: "sm" | "md" }) {
  return (
    <a
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium no-underline transition-colors",
        size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-sm",
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-accent hover:bg-accent-soft",
      )}
    >
      {children}
    </a>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-lg border border-line bg-surface", className)}>{children}</div>;
}

export function Chip({ children, tone = "neutral", title }: { children: React.ReactNode; tone?: "neutral" | "accent" | "good" | "warn" | "danger"; title?: string }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "good" && "bg-good-soft text-good",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "danger" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </span>
  );
}

const EV_SHORT: Record<EvidenceClass, string> = {
  verified_fact: "V",
  field_observation: "F",
  third_party_estimate: "3P",
  user_input: "U",
  model_assumption: "A",
  unknown: "?",
};
const EV_VAR: Record<EvidenceClass, string> = {
  verified_fact: "--ev-verified",
  field_observation: "--ev-field",
  third_party_estimate: "--ev-third",
  user_input: "--ev-user",
  model_assumption: "--ev-model",
  unknown: "--ev-unknown",
};

/** Evidence badge: shape plus text, never colour alone. */
export function Evidence({ cls, full = false }: { cls: EvidenceClass; full?: boolean }) {
  return (
    <span
      title={EVIDENCE_LABEL[cls]}
      className="inline-flex items-center gap-1 rounded border px-1.5 py-px text-[11px] font-semibold figures whitespace-nowrap"
      style={{ color: `var(${EV_VAR[cls]})`, borderColor: `var(${EV_VAR[cls]})` }}
    >
      [{EV_SHORT[cls]}]{full && <span className="font-sans font-medium">{EVIDENCE_LABEL[cls]}</span>}
    </span>
  );
}

/** A 20-100 score with its low-high range, drawn to scale. */
export function ScoreRange({ low, base, high, dim = false }: { low: number; base: number; high: number; dim?: boolean }) {
  const pos = (v: number) => `${((v - 20) / 80) * 100}%`;
  return (
    <div className={cx("flex items-center gap-3", dim && "opacity-60")}>
      <span className="figures w-8 text-right text-[17px] font-semibold">{Math.round(base)}</span>
      <div className="relative h-2 flex-1 min-w-[90px] rounded-full bg-surface-2" aria-label={`Score ${Math.round(base)}, range ${Math.round(low)} to ${Math.round(high)}`}>
        <div className="absolute top-0 h-2 rounded-full bg-accent-soft" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }} />
        <div className="absolute -top-1 h-4 w-1 rounded bg-accent" style={{ left: `calc(${pos(base)} - 2px)` }} />
      </div>
      <span className="figures w-14 text-[12px] text-muted">{Math.round(low)}-{Math.round(high)}</span>
    </div>
  );
}

export function Explain({ term, context, label }: { term: string; context?: string[]; label?: string }) {
  const { explain } = useGame();
  const t = termById(term);
  return (
    <button type="button" onClick={() => explain(term, context)} className="cursor-pointer text-[12px] font-medium text-accent underline decoration-dotted underline-offset-2 hover:opacity-80">
      {label ?? `What is ${t?.term.toLowerCase() ?? "this"}?`}
    </button>
  );
}

export function ExplainDrawer() {
  const { explaining, closeExplain, update } = useGame();
  const t = explaining ? termById(explaining.termId) : null;
  useEffect(() => {
    if (!explaining) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeExplain();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explaining, closeExplain]);
  useEffect(() => {
    if (t) update((g) => (g.learned.includes(t.id) ? g : { ...g, learned: [...g.learned, t.id] }));
  }, [t, update]);
  if (!t || !explaining) return null;
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={closeExplain}>
      <aside
        role="dialog"
        aria-label={t.term}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-6"
        style={{ paddingTop: "max(24px, env(safe-area-inset-top, 0px))", paddingRight: "max(24px, env(safe-area-inset-right, 0px))", paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{t.area}</div>
            <h2 className="mt-1 text-xl font-semibold">{t.term}</h2>
          </div>
          <Button size="sm" onClick={closeExplain} aria-label="Close">Close</Button>
        </div>
        <p className="mt-4 text-[15px]">{t.short}</p>
        {explaining.context.length > 0 && (
          <div className="mt-4 rounded-md bg-accent-soft p-3 text-[14px]">
            <div className="eyebrow mb-1 !text-accent">With your numbers</div>
            {explaining.context.map((l, i) => <p key={i} className="mt-1 first:mt-0">{l}</p>)}
          </div>
        )}
        {t.formula && (
          <div className="mt-4">
            <div className="eyebrow">Formula</div>
            <p className="figures mt-1 rounded bg-surface-2 p-2 text-[13px]">{t.formula}</p>
          </div>
        )}
        <Detail title="Why it matters" text={t.why} />
        <Detail title="Common mistakes" text={t.mistakes} />
        <Detail title="What it helps you decide" text={t.informs} />
        <p className="mt-6 text-[12px] text-muted">Benchmarks are shown only when a credible source exists. None is attached to this term yet.</p>
      </aside>
    </div>
  );
}

function Detail({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4">
      <div className="eyebrow">{title}</div>
      <p className="mt-1 text-[14px]">{text}</p>
    </div>
  );
}

export function rupees(n: number | null): string {
  if (n === null) return "Not set";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-[13px] font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-[12px] text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass = "w-full rounded-md border border-line bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted";

/** Combined label for a capital band range, capitalised for display. */
export function capitalLabel(cap: readonly [CapitalBand, CapitalBand]): string {
  const l = capitalRangeLabel(cap);
  return l.charAt(0).toUpperCase() + l.slice(1);
}
