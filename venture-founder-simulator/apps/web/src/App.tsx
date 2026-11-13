import React, { useEffect, useState } from "react";
import { industryById, nextActions, profileFlags, stage, STAGE_NAMES } from "@vfs/discovery";
import { useGame } from "./game";
import { cx, ExplainDrawer } from "./ui";
import { CompareView } from "./views/Compare";
import { DataView } from "./views/Data";
import { HomeView } from "./views/Home";
import { IndustryView } from "./views/Industry";
import { LearnView } from "./views/Learn";
import { ProfileView } from "./views/Profile";
import { RadarView } from "./views/Radar";

function useHash(): string {
  const read = () => window.location.hash.replace(/^#/, "") || "home";
  const [h, setH] = useState(read);
  useEffect(() => {
    const on = () => {
      setH(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return h;
}

const NAV = [
  { hash: "home", label: "Action Centre" },
  { hash: "profile", label: "Founder profile" },
  { hash: "radar", label: "Opportunity Radar" },
  { hash: "compare", label: "Compare" },
  { hash: "learn", label: "Learning Centre" },
  { hash: "data", label: "Save and data" },
];

const LOCKED = [
  { label: "Customer discovery", unlock: "Stage 2 (next build)" },
  { label: "Business model lab", unlock: "Stage 3" },
  { label: "Validation studio", unlock: "Stage 4" },
  { label: "Company setup", unlock: "Stage 5" },
  { label: "Finance and cash", unlock: "Stage 8" },
  { label: "Funding room", unlock: "Stage 11" },
];

export function App() {
  const hash = useHash();
  const { game, toast, status, storage } = useGame();
  const st = stage(game);
  const active = hash.startsWith("industry-") ? "radar" : hash.startsWith("learn") ? "learn" : hash;

  // First visit lands on the profile, which is the only sensible first step.
  useEffect(() => {
    if (!window.location.hash && st === 0 && game.profile.motivation.length === 0) window.location.hash = "#profile";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let view: React.ReactNode;
  if (hash === "profile") view = <ProfileView />;
  else if (hash === "radar") view = <RadarView />;
  else if (hash === "compare") view = <CompareView />;
  else if (hash === "data") view = <DataView />;
  else if (hash === "learn") view = <LearnView />;
  else if (hash.startsWith("learn-")) view = <LearnView termId={hash.slice(6)} />;
  else if (hash.startsWith("industry-")) view = <IndustryView id={hash.slice(9)} />;
  else view = <HomeView />;

  const unknowns = game.shortlist.reduce((n, id) => n + (industryById(id)?.card?.unknowns.length ?? 0), 0);
  const pending = nextActions(game).filter((t) => t.kind === "decision").length;
  const warnings = profileFlags(game.profile).filter((f) => f.severity === "warning").length;

  return (
    <div className="mx-auto min-h-full max-w-[1240px] pb-16">
      <header className="sticky z-20 -mx-4 border-b border-line bg-surface px-4" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <a href="#home" className="flex items-center gap-2 no-underline">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-[14px] font-bold text-accent-ink" aria-hidden="true">VF</span>
            <span className="font-display text-[16px] font-semibold text-ink">Venture Founder Simulator</span>
          </a>
          <div className="figures flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted">
            <span>Sim date <b className="text-ink">Fri 13 Nov 2026</b></span>
            <span>Bengaluru · INR</span>
            <span className={status === "unsaved" ? "text-warn" : ""}>{storage === "checking" ? "Loading" : status === "saving" ? "Saving" : status === "unsaved" ? "Not saved" : "Saved"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line py-2 text-[12px]">
          <Strip label="Stage" value={`${st} · ${STAGE_NAMES[st]}`} />
          <Strip label="Shortlisted" value={`${game.shortlist.length} of 4`} />
          <Strip label="Open unknowns" value={String(unknowns)} />
          <Strip label="Decisions pending" value={String(pending)} />
          <Strip label="Money at risk" value="₹0" hint="Nothing spent or committed yet" />
          {warnings > 0 && <Strip label="Warnings" value={String(warnings)} tone="warn" />}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Main" className="min-w-0 md:sticky md:top-32 md:self-start">
          <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {NAV.map((n) => (
              <li key={n.hash}>
                <a href={`#${n.hash}`} aria-current={active === n.hash ? "page" : undefined}
                  className={cx("block whitespace-nowrap rounded-md px-3 py-2 text-[14px] no-underline", active === n.hash ? "bg-accent-soft font-semibold text-accent" : "text-ink hover:bg-surface-2")}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 hidden md:block">
            <div className="eyebrow px-3">Unlocks later</div>
            <ul className="mt-2 space-y-0.5">
              {LOCKED.map((l) => (
                <li key={l.label} className="px-3 py-1.5 text-[13px] text-muted" title={`Unlocks at ${l.unlock}`}>
                  {l.label}<span className="block text-[11px]">{l.unlock}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <main className="min-w-0">{view}</main>
      </div>

      <ExplainDrawer />
      {toast && (
        <div role="status" className="fixed left-1/2 z-40 -translate-x-1/2 rounded-md bg-ink px-4 py-2.5 text-[14px] text-bg shadow-lg" style={{ bottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function Strip({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <span title={hint} className="whitespace-nowrap">
      <span className="text-muted">{label} </span>
      <b className={cx("figures", tone === "warn" ? "text-warn" : "text-ink")}>{value}</b>
    </span>
  );
}
