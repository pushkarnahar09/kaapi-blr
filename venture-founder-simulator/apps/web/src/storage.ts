/**
 * Saving the game.
 * 1. Signed in on claude.ai: your private per-user document in the artifact's database
 *    (data/users/<your id>/save), private even from the artifact's owner, kept across devices.
 * 2. Otherwise: this browser's storage, which can be cleared. Export a file as a backup.
 */
import { loadGame, newGame, type GameState } from "@vfs/discovery";

type Snapshot = { exists: boolean; data(): Record<string, unknown> | undefined };
type DocRef = { get(): Promise<Snapshot>; set(data: Record<string, unknown>): Promise<void> };
type Db = { doc(path: string): DocRef };
type User = { id(): Promise<string | null> };
type Downloads = { save(req: { filename: string; data: string }): Promise<unknown> };
type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

const LOCAL_KEY = "vfs.save.v1";

function use<T>(name: string): Promise<T | null> {
  const c = (window as unknown as ClaudeWindow).claude;
  if (!c?.use) return Promise.resolve(null);
  return c.use(name).then((x) => (x as T) ?? null).catch(() => null);
}

export type StorageKind = "account" | "browser" | "none";

export interface SaveStore {
  readonly kind: StorageKind;
  load(): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  /** Synchronous browser copy, for when the page is being hidden or closed. */
  saveLocalNow(state: GameState): void;
}

interface Stamped {
  game: GameState;
  savedAt: string;
}

function readLocal(): Stamped | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { game?: unknown; savedAt?: string; version?: number };
    // Older saves stored the game directly.
    if (parsed.version === 1) return { game: loadGame(parsed), savedAt: "" };
    return parsed.game ? { game: loadGame(parsed.game), savedAt: parsed.savedAt ?? "" } : null;
  } catch {
    return null;
  }
}

function writeLocal(state: GameState, savedAt = new Date().toISOString()): boolean {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify({ game: state, savedAt }));
    return true;
  } catch {
    return false;
  }
}

function localAvailable(): boolean {
  try {
    const k = "vfs.probe";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const browserStore = (): SaveStore => {
  const ok = localAvailable();
  return {
    kind: ok ? "browser" : "none",
    load: async () => (ok ? readLocal()?.game ?? null : null),
    save: async (s) => {
      if (ok) writeLocal(s);
    },
    saveLocalNow: (s) => {
      if (ok) writeLocal(s);
    },
  };
};

/** Resolve the best available store. Never throws; never blocks first paint. */
export async function openStore(): Promise<SaveStore> {
  const [db, user] = await Promise.all([use<Db>("db"), use<User>("user")]);
  const uid = user ? await user.id().catch(() => null) : null;
  if (!db || !uid) return browserStore();

  let ref: DocRef;
  try {
    ref = db.doc(`data/users/${uid}/save`);
  } catch {
    return browserStore();
  }

  let writing: Promise<void> = Promise.resolve();
  return {
    kind: "account",
    async load() {
      const local = readLocal();
      let remote: Stamped | null = null;
      try {
        const snap = await ref.get();
        if (snap.exists) {
          const body = snap.data() as { game?: unknown; savedAt?: string } | undefined;
          if (body?.game) remote = { game: loadGame(body.game), savedAt: body.savedAt ?? "" };
        }
      } catch {
        /* fall through to the browser copy */
      }
      // Keep whichever copy is newer (the browser copy can be ahead if the tab closed mid-save).
      if (remote && local) return local.savedAt > remote.savedAt ? local.game : remote.game;
      return remote?.game ?? local?.game ?? null;
    },
    save(state) {
      const savedAt = new Date().toISOString();
      writeLocal(state, savedAt); // keep a local copy too
      // One write at a time to the same document.
      writing = writing.then(() => ref.set({ game: state as unknown as Record<string, unknown>, savedAt })).catch(() => undefined);
      return writing;
    },
    saveLocalNow: (s) => {
      writeLocal(s);
    },
  };
}

export function exportJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

/** Offer the save as a file. Returns false if this view cannot download (show copyable text instead). */
export async function downloadSave(state: GameState): Promise<"saved" | "declined" | "unavailable"> {
  const dl = await use<Downloads>("downloads");
  if (!dl) return "unavailable";
  try {
    await dl.save({ filename: `founder-simulator-save-${new Date().toISOString().slice(0, 10)}.json`, data: exportJson(state) });
    return "saved";
  } catch (e) {
    const code = (e as { code?: string })?.code;
    return code === "declined" ? "declined" : "unavailable";
  }
}

export function importJson(text: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON. Choose a save file exported from this simulator.");
  }
  return loadGame(parsed);
}

export { newGame };
