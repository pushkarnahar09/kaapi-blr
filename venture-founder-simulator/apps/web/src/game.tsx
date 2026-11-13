import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { newGame, type GameState } from "@vfs/discovery";
import { openStore, type SaveStore, type StorageKind } from "./storage";

type SaveStatus = "loading" | "saved" | "saving" | "unsaved";

interface GameCtx {
  game: GameState;
  update(fn: (g: GameState) => GameState): void;
  replace(g: GameState): void;
  storage: StorageKind | "checking";
  status: SaveStatus;
  explain(termId: string, context?: string[]): void;
  explaining: { termId: string; context: string[] } | null;
  closeExplain(): void;
  toast: string | null;
  notify(msg: string): void;
}

const Ctx = createContext<GameCtx | null>(null);

export function useGame(): GameCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside GameProvider");
  return c;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<GameState>(newGame);
  const [storage, setStorage] = useState<StorageKind | "checking">("checking");
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [explaining, setExplaining] = useState<{ termId: string; context: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const store = useRef<SaveStore | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    openStore().then(async (s) => {
      if (!alive) return;
      store.current = s;
      setStorage(s.kind);
      const saved = await s.load();
      if (!alive) return;
      if (saved) setGame(saved);
      loaded.current = true;
      setStatus("saved");
    });
    return () => {
      alive = false;
    };
  }, []);

  const pending = useRef<GameState | null>(null);

  const flush = useCallback(() => {
    timer.current = undefined;
    const g = pending.current;
    if (!g || !store.current) return;
    pending.current = null;
    store.current.save(g).then(() => setStatus(pending.current ? "saving" : "saved")).catch(() => setStatus("unsaved"));
  }, []);

  // Save at most once a second, however busy the player is (a throttle, not a debounce,
  // so continuous activity can never starve the save).
  const persist = useCallback((g: GameState) => {
    if (!loaded.current || !store.current) {
      setStatus("unsaved");
      return;
    }
    pending.current = g;
    setStatus("saving");
    if (timer.current === undefined) timer.current = window.setTimeout(flush, 1000);
  }, [flush]);

  // If the page is hidden or closed with a save pending, write the browser copy at once.
  useEffect(() => {
    const now = () => {
      if (pending.current && store.current) {
        store.current.saveLocalNow(pending.current);
        flush();
      }
    };
    const onVis = () => document.visibilityState === "hidden" && now();
    window.addEventListener("pagehide", now);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", now);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flush]);

  const update = useCallback(
    (fn: (g: GameState) => GameState) => {
      setGame((prev) => {
        const next = fn(prev);
        if (next !== prev) persist(next);
        return next;
      });
    },
    [persist],
  );

  const replace = useCallback((g: GameState) => update(() => g), [update]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  }, []);

  const value: GameCtx = {
    game,
    update,
    replace,
    storage,
    status,
    explain: (termId, context = []) => setExplaining({ termId, context }),
    explaining,
    closeExplain: () => setExplaining(null),
    toast,
    notify,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
