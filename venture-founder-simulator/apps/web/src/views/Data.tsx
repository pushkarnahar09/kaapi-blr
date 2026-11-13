import React, { useRef, useState } from "react";
import { newGame } from "@vfs/discovery";
import { useGame } from "../game";
import { downloadSave, exportJson, importJson } from "../storage";
import { Button, Card, Chip, inputClass } from "../ui";

export function DataView() {
  const { game, replace, storage, status, notify } = useGame();
  const [showJson, setShowJson] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const storageText = {
    account: "Saved privately to your claude.ai account for this simulator. Only you can read it, and it follows you across devices.",
    browser: "Saved in this browser only. Clearing site data or switching device loses it, so export a backup now and then.",
    none: "This view cannot save. Export your game before closing the page.",
    checking: "Checking where your game can be saved...",
  }[storage];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <div className="eyebrow">Your data</div>
        <h1 className="mt-1 text-[26px] font-semibold">Save, export and decision log</h1>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-semibold">Where your game is saved</h2>
          <Chip tone={storage === "account" ? "good" : storage === "browser" ? "warn" : "danger"}>{storage === "account" ? "Your account" : storage === "browser" ? "This browser" : storage === "none" ? "Not saving" : "Checking"}</Chip>
          <Chip>{status === "saved" ? "All changes saved" : status === "saving" ? "Saving" : status === "loading" ? "Loading" : "Unsaved changes"}</Chip>
        </div>
        <p className="mt-2 text-[14px]">{storageText}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={async () => {
            const r = await downloadSave(game);
            if (r === "saved") notify("Save file downloaded.");
            else if (r === "declined") notify("Download cancelled.");
            else { setShowJson(true); notify("Downloads are not available here. Copy the text below instead."); }
          }}>Export save file</Button>
          <Button onClick={() => file.current?.click()}>Import save file</Button>
          <Button onClick={() => setShowJson(!showJson)}>{showJson ? "Hide" : "Show"} save as text</Button>
          <input ref={file} id="import-file" type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              replace(importJson(await f.text()));
              setImportError(null);
              notify("Save imported.");
            } catch (err) {
              setImportError((err as Error).message);
            }
            e.target.value = "";
          }} />
        </div>
        {importError && <p className="mt-2 text-[13px] text-danger">{importError}</p>}
        {showJson && (
          <div className="mt-3">
            <textarea id="save-json" readOnly rows={8} className={`${inputClass} figures text-[12px]`} value={exportJson(game)} onFocus={(e) => e.target.select()} />
            <Button size="sm" className="mt-2" onClick={() => {
              navigator.clipboard?.writeText(exportJson(game)).then(() => notify("Copied."), () => notify("Select the text and copy it manually."));
            }}>Copy</Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">Decision log</h2>
        <p className="mt-1 text-[13px] text-muted">Every decision you make is recorded with its date and your reasoning. Later stages use it to assess the quality of your decisions, separately from how they turned out.</p>
        {game.decisions.length === 0 ? <p className="mt-3 text-[14px] text-muted">No decisions yet.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead><tr className="text-left text-muted"><th className="pb-2 font-medium">When</th><th className="pb-2 font-medium">Decision</th><th className="pb-2 font-medium">Detail and reasoning</th></tr></thead>
              <tbody>
                {[...game.decisions].reverse().slice(0, 60).map((d, n) => (
                  <tr key={n} className="border-t border-line align-top">
                    <td className="figures py-2 pr-3 whitespace-nowrap text-muted">{new Date(d.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 pr-3 font-medium">{d.type.replace(/([a-z])([A-Z])/g, "$1 $2")}</td>
                    <td className="py-2 break-words">{d.type === "WeightsSet" ? "Scoring weights updated" : d.detail}{d.rationale ? <span className="block text-muted">{d.rationale}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">Start over</h2>
        <p className="mt-1 text-[13px] text-muted">Clears your profile, shortlist, scores and decisions. Export first if you might want them back.</p>
        {confirmReset ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-medium">Clear everything?</span>
            <Button variant="danger" onClick={() => { replace(newGame()); setConfirmReset(false); notify("Started a new game."); window.location.hash = "#home"; }}>Yes, clear it</Button>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          </div>
        ) : <Button variant="danger" className="mt-3" onClick={() => setConfirmReset(true)}>Start a new game</Button>}
      </Card>
    </div>
  );
}
