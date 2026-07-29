// Application state: the list of APGs and the visual theme.
//
// Persistence is now REMOTE and SHARED: the acervo lives in MongoDB Atlas, served
// by the Vercel serverless API in /api. Two people (behind the same shared
// password) edit the same data from different machines. There is no local
// IndexedDB/localStorage copy of the DATA anymore — that used to silo the acervo
// to one PC. Sync model:
//   - Each APG is saved INDEPENDENTLY (debounced) → editing different APGs never
//     clobbers each other; on the same APG, last write wins (agreed trade-off).
//   - A poll every few seconds reads only the MANIFEST (one id + timestamp per
//     APG) and re-downloads just the APGs whose timestamp moved. It used to pull
//     the entire acervo — images included — every 7 s, which grew past what a
//     serverless response may carry and made every request fail with a 500.
//   - APGs with an unsaved local edit ("dirty") are never overwritten by the
//     poll — so your typing is safe until it's saved, then the server copy
//     takes over.
//
// "Has this APG changed?" is answered by OBJECT IDENTITY, not by comparing
// serialized copies: the reducer only builds a new object for the APG it
// touches, so `serverCopy.get(id) !== apg` is both exact and instant. The old
// JSON.stringify-everything comparison had to walk every base64 image on every
// keystroke and on every poll, which is what made the editor freeze.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { APG, APGImage, DEFAULT_THEME, ThemeSettings } from "./types";
import {
  AuthError,
  LoadProgress,
  Manifest,
  deleteApgRemote,
  fetchApgs,
  fetchManifest,
  getPassword,
  saveApg,
  saveTheme,
  setPassword,
} from "./api";
import { LoginGate } from "../components/LoginGate";

// How often to pull the peer's changes from the server.
const POLL_MS = 7000;
// Debounce before pushing a changed APG / theme to the server.
const SAVE_DEBOUNCE_MS = 800;

interface AppState {
  apgs: APG[];
  theme: ThemeSettings;
  selectedId: string | null;
}

type Action =
  | { type: "ADD_APG" }
  | { type: "DELETE_APG"; id: string }
  | { type: "SELECT_APG"; id: string | null }
  | { type: "UPDATE_APG"; id: string; patch: Partial<APG> }
  | { type: "ADD_IMAGE"; id: string; image: APGImage }
  | { type: "UPDATE_IMAGE"; id: string; imageId: string; patch: Partial<APGImage> }
  | { type: "REMOVE_IMAGE"; id: string; imageId: string }
  | { type: "MOVE_APG"; id: string; dir: -1 | 1 }
  | { type: "IMPORT_APGS"; apgs: unknown[]; replace?: boolean }
  | { type: "SET_APGS"; apgs: APG[]; selectedId?: string | null }
  | { type: "SET_THEME"; patch: Partial<ThemeSettings> }
  | { type: "RESET_THEME" }
  | { type: "LOAD"; state: AppState };

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/** Sanitize an imported/loaded APG object into the canonical shape (stable key
 *  order so JSON diffs used for dirty-tracking are reliable). */
function normalizeApg(a: any, id = uid()): APG {
  return {
    id,
    periodo: Math.max(1, Math.round(Number(a?.periodo)) || 1),
    numero: Math.max(1, Math.round(Number(a?.numero)) || 1),
    titulo: typeof a?.titulo === "string" ? a.titulo : "",
    objetivosRaw: typeof a?.objetivosRaw === "string" ? a.objetivosRaw : "",
    conteudoRaw: typeof a?.conteudoRaw === "string" ? a.conteudoRaw : "",
    images: Array.isArray(a?.images) ? a.images : [],
    exercises: Array.isArray(a?.exercises) ? a.exercises : [],
  };
}

/** Loaded from the server: keep the SAME id (so it maps to the same document). */
function loadedApg(a: any): APG {
  return normalizeApg(a, typeof a?.id === "string" ? a.id : uid());
}

/** Public helper: sanitize an imported APG with a fresh id (for the import UI). */
export function importApg(a: unknown): APG {
  return normalizeApg(a);
}

/** Next APG number for a given period (auto-increment helper). */
function nextNumero(apgs: APG[], periodo: number): number {
  const inPeriod = apgs.filter((a) => a.periodo === periodo);
  return inPeriod.length ? Math.max(...inPeriod.map((a) => a.numero)) + 1 : 1;
}

function newApg(apgs: APG[]): APG {
  const periodo = apgs.length ? apgs[apgs.length - 1].periodo : 1;
  return {
    id: uid(),
    periodo,
    numero: nextNumero(apgs, periodo),
    titulo: "",
    objetivosRaw: "",
    conteudoRaw: "",
    images: [],
    exercises: [],
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD":
      return action.state;

    case "ADD_APG": {
      const apg = newApg(state.apgs);
      return { ...state, apgs: [...state.apgs, apg], selectedId: apg.id };
    }

    case "DELETE_APG": {
      const apgs = state.apgs.filter((a) => a.id !== action.id);
      const selectedId =
        state.selectedId === action.id ? apgs[0]?.id ?? null : state.selectedId;
      return { ...state, apgs, selectedId };
    }

    case "SELECT_APG":
      return { ...state, selectedId: action.id };

    case "UPDATE_APG":
      return {
        ...state,
        apgs: state.apgs.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      };

    case "ADD_IMAGE":
      return {
        ...state,
        apgs: state.apgs.map((a) =>
          a.id === action.id ? { ...a, images: [...a.images, action.image] } : a
        ),
      };

    case "UPDATE_IMAGE":
      return {
        ...state,
        apgs: state.apgs.map((a) =>
          a.id === action.id
            ? {
                ...a,
                images: a.images.map((i) =>
                  i.id === action.imageId ? { ...i, ...action.patch } : i
                ),
              }
            : a
        ),
      };

    case "REMOVE_IMAGE":
      return {
        ...state,
        apgs: state.apgs.map((a) =>
          a.id === action.id
            ? { ...a, images: a.images.filter((i) => i.id !== action.imageId) }
            : a
        ),
      };

    case "MOVE_APG": {
      const idx = state.apgs.findIndex((a) => a.id === action.id);
      const j = idx + action.dir;
      if (idx < 0 || j < 0 || j >= state.apgs.length) return state;
      const apgs = [...state.apgs];
      [apgs[idx], apgs[j]] = [apgs[j], apgs[idx]];
      return { ...state, apgs };
    }

    case "IMPORT_APGS": {
      const incoming = action.apgs.map((a) => normalizeApg(a));
      if (incoming.length === 0) return state;
      const apgs = action.replace ? incoming : [...state.apgs, ...incoming];
      return { ...state, apgs, selectedId: incoming[0].id };
    }

    case "SET_APGS": {
      const apgs = action.apgs;
      const keep = state.selectedId && apgs.some((a) => a.id === state.selectedId);
      const selectedId =
        action.selectedId !== undefined
          ? action.selectedId
          : keep
          ? state.selectedId
          : apgs[0]?.id ?? null;
      return { ...state, apgs, selectedId };
    }

    case "SET_THEME":
      return { ...state, theme: { ...state.theme, ...action.patch } };

    case "RESET_THEME":
      return { ...state, theme: { ...DEFAULT_THEME } };

    default:
      return state;
  }
}

const initialState: AppState = {
  apgs: [],
  theme: { ...DEFAULT_THEME },
  selectedId: null,
};

type Phase = "gate" | "loading" | "ready";

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Convenience: the currently selected APG, if any. */
  selected: APG | null;
  /** False when the server can't currently be reached (edits are local-only). */
  online: boolean;
  /** Last sync error message (save/poll), if any. */
  syncError: string | null;
}

const AppContext = createContext<Ctx | null>(null);

function BootSplash({
  error,
  onRetry,
  progress,
}: {
  error?: string | null;
  onRetry?: () => void;
  progress?: LoadProgress | null;
}) {
  return (
    <div className="boot-splash">
      <div className="boot-mark">D</div>
      {error ? (
        <>
          <div>Não foi possível carregar o acervo.</div>
          <div className="boot-err">{error}</div>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              Tentar de novo
            </button>
          )}
        </>
      ) : (
        <div>
          Carregando o acervo compartilhado…
          {progress && progress.total > 0 && (
            <> ({progress.loaded}/{progress.total} imagens)</>
          )}
        </div>
      )}
    </div>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [phase, setPhase] = useState<Phase>(getPassword() ? "loading" : "gate");
  const [online, setOnline] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [bootErr, setBootErr] = useState<string | null>(null);
  const [bootProgress, setBootProgress] = useState<LoadProgress | null>(null);

  // Latest values, readable from timers/intervals without stale closures.
  const latestApgs = useRef<APG[]>(state.apgs);
  latestApgs.current = state.apgs;
  const latestTheme = useRef<ThemeSettings>(state.theme);
  latestTheme.current = state.theme;

  // Sync bookkeeping.
  // id → the exact APG object the server currently holds. Identity comparison
  // against it is what detects local edits (see the header note).
  const serverCopy = useRef<Map<string, APG>>(new Map());
  // id → server `updatedAt`, so the poll can tell "a peer changed this" from
  // "this is the write I just made".
  const knownUpdatedAt = useRef<Map<string, number>>(new Map());
  const lastTheme = useRef<string>("");
  const dirty = useRef<Set<string>>(new Set()); // ids with an unsaved local edit
  const themeDirty = useRef(false);
  const saveTimers = useRef<Map<string, number>>(new Map());
  const themeTimer = useRef<number>();
  // Only persist after a SUCCESSFUL initial load — otherwise an empty in-memory
  // state could overwrite the real acervo on the server.
  const canPersist = useRef(false);

  // Drop back to the login screen (bad/expired password).
  const toGate = useCallback(() => {
    setPassword(null);
    canPersist.current = false;
    serverCopy.current.clear();
    knownUpdatedAt.current.clear();
    dirty.current.clear();
    setPhase("gate");
  }, []);

  // --- Initial load ---------------------------------------------------------
  // Manifest first (tiny), then the APGs themselves in bounded batches, so the
  // acervo can grow without any single response outgrowing the platform limit.
  const boot = useCallback(async () => {
    setBootErr(null);
    setBootProgress(null);
    try {
      const manifest = await fetchManifest();
      const order = manifest.apgs.map((a) => a.id);
      const loaded = await fetchApgs(order, setBootProgress);
      const byId = new Map(loaded.map((a) => [a.id, loadedApg(a)]));
      const apgs = order.map((id) => byId.get(id)).filter((a): a is APG => !!a);
      const theme = { ...DEFAULT_THEME, ...(manifest.theme ?? {}) };

      serverCopy.current = new Map(apgs.map((a) => [a.id, a]));
      knownUpdatedAt.current = new Map(
        manifest.apgs.filter((m) => byId.has(m.id)).map((m) => [m.id, m.updatedAt])
      );
      lastTheme.current = JSON.stringify(theme);
      dirty.current.clear();
      themeDirty.current = false;
      dispatch({ type: "LOAD", state: { apgs, theme, selectedId: apgs[0]?.id ?? null } });
      canPersist.current = true;
      setOnline(true);
      setSyncError(null);
      setPhase("ready");
    } catch (e) {
      if (e instanceof AuthError) {
        toGate();
        return;
      }
      setBootErr((e as Error).message || "Falha de conexão.");
    }
  }, [toGate]);

  useEffect(() => {
    if (phase === "loading") boot();
  }, [phase, boot]);

  // --- Push one APG (debounced) --------------------------------------------
  const scheduleSave = useCallback(
    (id: string) => {
      const timers = saveTimers.current;
      if (timers.has(id)) window.clearTimeout(timers.get(id)!);
      const t = window.setTimeout(() => {
        timers.delete(id);
        const apg = latestApgs.current.find((a) => a.id === id);
        if (!apg) {
          dirty.current.delete(id);
          return;
        }
        saveApg(apg).then(
          (updatedAt) => {
            serverCopy.current.set(id, apg);
            knownUpdatedAt.current.set(id, updatedAt);
            // Clear dirty only if nothing changed again while saving.
            if (latestApgs.current.find((a) => a.id === id) === apg) dirty.current.delete(id);
            setOnline(true);
            setSyncError(null);
          },
          (e) => {
            if (e instanceof AuthError) toGate();
            else {
              setOnline(false);
              setSyncError((e as Error).message);
            }
          }
        );
      }, SAVE_DEBOUNCE_MS);
      timers.set(id, t);
    },
    [toGate]
  );

  // Detect per-APG changes and deletions, and push them.
  useEffect(() => {
    if (phase !== "ready" || !canPersist.current) return;
    const current = state.apgs;
    const curIds = new Set(current.map((a) => a.id));

    // Deletions: was tracked, now gone locally.
    for (const id of Array.from(serverCopy.current.keys())) {
      if (!curIds.has(id)) {
        serverCopy.current.delete(id);
        knownUpdatedAt.current.delete(id);
        dirty.current.delete(id);
        if (saveTimers.current.has(id)) {
          window.clearTimeout(saveTimers.current.get(id)!);
          saveTimers.current.delete(id);
        }
        deleteApgRemote(id).then(
          () => {
            setOnline(true);
            setSyncError(null);
          },
          (e) => {
            if (e instanceof AuthError) toGate();
            else {
              setOnline(false);
              setSyncError((e as Error).message);
            }
          }
        );
      }
    }

    // Upserts: new or changed since last server sync. The reducer preserves the
    // object of every APG it didn't touch, so this identity check is exact.
    for (const a of current) {
      if (serverCopy.current.get(a.id) !== a) {
        dirty.current.add(a.id);
        scheduleSave(a.id);
      }
    }
  }, [state.apgs, phase, scheduleSave, toGate]);

  // --- Push theme (debounced) ----------------------------------------------
  useEffect(() => {
    if (phase !== "ready" || !canPersist.current) return;
    const json = JSON.stringify(state.theme);
    if (json === lastTheme.current) return;
    themeDirty.current = true;
    window.clearTimeout(themeTimer.current);
    themeTimer.current = window.setTimeout(() => {
      saveTheme(state.theme).then(
        () => {
          lastTheme.current = json;
          if (JSON.stringify(latestTheme.current) === json) themeDirty.current = false;
          setOnline(true);
          setSyncError(null);
        },
        (e) => {
          if (e instanceof AuthError) toGate();
          else {
            setOnline(false);
            setSyncError((e as Error).message);
          }
        }
      );
    }, SAVE_DEBOUNCE_MS);
  }, [state.theme, phase, toGate]);

  // --- Poll the server and merge peer changes ------------------------------
  const mergeRemote = useCallback((remoteApgs: APG[], remoteTheme: Manifest["theme"]) => {
    const local = latestApgs.current;
    const localById = new Map(local.map((a) => [a.id, a]));
    const remoteById = new Map(remoteApgs.map((a) => [a.id, a]));
    const resultById = new Map<string, APG>();

    // Server is the source of truth, EXCEPT for APGs with unsaved local edits.
    for (const [id, rem] of remoteById) {
      if (dirty.current.has(id)) {
        resultById.set(id, localById.get(id) ?? rem);
      } else {
        resultById.set(id, rem);
        serverCopy.current.set(id, rem); // adopted → not dirty
      }
    }
    // Local APGs the server doesn't have.
    for (const [id, loc] of localById) {
      if (remoteById.has(id)) continue;
      if (serverCopy.current.has(id)) {
        // Existed before, gone from server ⇒ deleted by the peer → drop it.
        serverCopy.current.delete(id);
        knownUpdatedAt.current.delete(id);
        dirty.current.delete(id);
      } else {
        // Brand-new local APG not yet saved → keep it.
        resultById.set(id, loc);
      }
    }

    // Preserve local order; append genuinely new ids at the end.
    const orderedIds: string[] = [];
    for (const a of local) if (resultById.has(a.id)) orderedIds.push(a.id);
    for (const id of resultById.keys()) if (!orderedIds.includes(id)) orderedIds.push(id);
    const apgs = orderedIds.map((id) => resultById.get(id)!);

    const changed =
      apgs.length !== local.length || apgs.some((a, i) => a !== local[i]);
    if (changed) dispatch({ type: "SET_APGS", apgs });

    // Theme (don't clobber an in-progress local theme edit).
    if (remoteTheme && !themeDirty.current) {
      const t = { ...DEFAULT_THEME, ...remoteTheme };
      const tj = JSON.stringify(t);
      if (tj !== JSON.stringify(latestTheme.current)) {
        lastTheme.current = tj;
        dispatch({ type: "SET_THEME", patch: t });
      }
    }
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    let running = false;

    const iv = window.setInterval(async () => {
      // A slow round (a peer just uploaded images) must not stack up requests.
      if (running) return;
      running = true;
      try {
        const manifest = await fetchManifest();

        // Only APGs whose server timestamp moved need downloading; ones we're
        // still editing are skipped entirely (the local copy wins anyway).
        const stale = manifest.apgs
          .filter((m) => !dirty.current.has(m.id))
          .filter(
            (m) =>
              !serverCopy.current.has(m.id) || knownUpdatedAt.current.get(m.id) !== m.updatedAt
          )
          .map((m) => m.id);

        const before = new Map(knownUpdatedAt.current);
        const fetched = stale.length > 0 ? await fetchApgs(stale) : [];
        const freshById = new Map<string, APG>();
        for (const a of fetched) {
          // A save of ours that landed while this round was downloading is
          // newer than what we just read — don't let the poll undo it.
          if (knownUpdatedAt.current.get(a.id) !== before.get(a.id)) continue;
          freshById.set(a.id, loadedApg(a));
        }
        for (const m of manifest.apgs) {
          if (freshById.has(m.id)) knownUpdatedAt.current.set(m.id, m.updatedAt);
        }

        // Rebuild the server's view: freshly fetched, else the copy we already
        // hold, else (still editing it) our local one.
        const remoteApgs: APG[] = [];
        for (const m of manifest.apgs) {
          const a =
            freshById.get(m.id) ??
            serverCopy.current.get(m.id) ??
            (dirty.current.has(m.id)
              ? latestApgs.current.find((x) => x.id === m.id)
              : undefined);
          if (a) remoteApgs.push(a);
        }

        setOnline(true);
        setSyncError(null);
        mergeRemote(remoteApgs, manifest.theme);
      } catch (e) {
        if (e instanceof AuthError) toGate();
        else setOnline(false);
      } finally {
        running = false;
      }
    }, POLL_MS);
    return () => window.clearInterval(iv);
  }, [phase, mergeRemote, toGate]);

  const selected = state.apgs.find((a) => a.id === state.selectedId) ?? null;

  if (phase === "gate") {
    return <LoginGate onAuthed={() => setPhase("loading")} />;
  }
  if (phase === "loading") {
    return (
      <BootSplash
        error={bootErr}
        onRetry={bootErr ? boot : undefined}
        progress={bootProgress}
      />
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch, selected, online, syncError }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { uid };
