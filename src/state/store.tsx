// Application state: the list of APGs and the visual theme.
//
// Persistence is REMOTE and SHARED (MongoDB Atlas behind the /api functions),
// with a LOCAL mirror in IndexedDB that exists purely so nothing can ever be
// lost. The three rules that shape everything below:
//
//   1. Every edit is written to the local mirror first. If the network, the
//      server or the browser dies, reopening the app brings the work back —
//      pictures included, because they are cached by content revision.
//   2. Each APG is saved INDEPENDENTLY and its pictures are saved one by one,
//      so no request is ever big enough to be rejected. A save that fails is
//      retried with backoff until it lands; the work stays "pending" until then.
//   3. The poll that pulls a peer's changes NEVER overwrites an APG that has an
//      unsaved edit, a save in flight, or a save that landed after the poll
//      started. That last case is what used to make an edit "come back": a
//      poll begun before your save returned the pre-save copy and quietly
//      restored it.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { APG, APGImage, DEFAULT_THEME, ThemeSettings } from "./types";
import {
  AuthError,
  NetworkError,
  RemoteState,
  deleteApgRemote,
  fetchBlobs,
  fetchState,
  getPassword,
  saveApg,
  saveBlob,
  saveTheme,
  setPassword,
} from "./api";
import {
  applyBlobs,
  cacheRead,
  cacheWrite,
  carryOverBlobs,
  collectBlobs,
  exKey,
  imgKey,
  isDataUrl,
  isHydrated,
  referencedRevs,
  revOf,
  toWire,
  wireJson,
  withRevs,
} from "./blobs";
import { blobPrune, idbGet, idbSet } from "./db";
import { LoginGate } from "../components/LoginGate";

// How often to pull the peer's changes from the server.
const POLL_MS = 7000;
// Debounce before pushing a changed APG / theme to the server.
const SAVE_DEBOUNCE_MS = 700;
// Retry backoff for a failed save: 1.2s, 2.4s, 4.8s … capped.
const RETRY_BASE_MS = 1200;
const RETRY_MAX_MS = 30000;
// Safety net: anything still unsaved is re-attempted on this beat, even if the
// user stopped typing (a failed save used to sit there forever).
const SWEEP_MS = 5000;
// Debounce before mirroring the acervo to IndexedDB.
const MIRROR_MS = 1200;

const SNAPSHOT_KEY = "acervo.snapshot";
const SNAPSHOT_VERSION = 2;

interface Snapshot {
  v: number;
  at: number;
  apgs: any[];
  theme: ThemeSettings;
  /** Ids that had not reached the server when this snapshot was written. */
  pending: string[];
}

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
  | { type: "HYDRATE"; blobs: Map<string, string> }
  | { type: "SET_THEME"; patch: Partial<ThemeSettings> }
  | { type: "RESET_THEME" }
  | { type: "LOAD"; state: AppState };

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/** Sanitize one uploaded image into the canonical shape. */
function normalizeImage(i: any): APGImage {
  const dataUrl = typeof i?.dataUrl === "string" ? i.dataUrl : "";
  const rev = typeof i?.rev === "string" && i.rev ? i.rev : isDataUrl(dataUrl) ? revOf(dataUrl) : "";
  return {
    id: String(i?.id ?? ""),
    dataUrl,
    caption: typeof i?.caption === "string" ? i.caption : "",
    width: Number(i?.width) || 0,
    height: Number(i?.height) || 0,
    rev,
  };
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
    images: (Array.isArray(a?.images) ? a.images : []).map(normalizeImage).filter((i: APGImage) => i.id),
    exercises: Array.isArray(a?.exercises) ? a.exercises.map(normalizeExercise) : [],
  };
}

function normalizeExercise(e: any): any {
  const dataUrl = typeof e?.imageDataUrl === "string" ? e.imageDataUrl : undefined;
  const rev =
    typeof e?.imageRev === "string" && e.imageRev
      ? e.imageRev
      : isDataUrl(dataUrl)
      ? revOf(dataUrl as string)
      : undefined;
  const out = { ...e };
  if (dataUrl) out.imageDataUrl = dataUrl;
  else delete out.imageDataUrl;
  if (rev) out.imageRev = rev;
  else delete out.imageRev;
  return out;
}

/** Loaded from the server/mirror: keep the SAME id (it maps to one document). */
function loadedApg(a: any): APG {
  return normalizeApg(a, typeof a?.id === "string" ? a.id : uid());
}

/** Public helper: sanitize an imported APG with a fresh id (for the import UI). */
export function importApg(a: unknown): APG {
  return withRevs(normalizeApg(a));
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

/** Give a revision to any picture that just arrived without one, keeping object
 *  identity when there is nothing to do (so React can skip re-rendering). */
function normalizeRevs(apgs: APG[]): APG[] {
  let changed = false;
  const out = apgs.map((a) => {
    const n = withRevs(a);
    if (n !== a) changed = true;
    return n;
  });
  return changed ? out : apgs;
}

function baseReducer(state: AppState, action: Action): AppState {
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
      const incoming = action.apgs.map((a) => withRevs(normalizeApg(a)));
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

    case "HYDRATE": {
      let changed = false;
      const apgs = state.apgs.map((a) => {
        const n = applyBlobs(a, action.blobs);
        if (n !== a) changed = true;
        return n;
      });
      return changed ? { ...state, apgs } : state;
    }

    case "SET_THEME":
      return { ...state, theme: { ...state.theme, ...action.patch } };

    case "RESET_THEME":
      return { ...state, theme: { ...DEFAULT_THEME } };

    default:
      return state;
  }
}

function reducer(state: AppState, action: Action): AppState {
  const next = baseReducer(state, action);
  if (next === state) return state;
  const apgs = normalizeRevs(next.apgs);
  return apgs === next.apgs ? next : { ...next, apgs };
}

const initialState: AppState = {
  apgs: [],
  theme: { ...DEFAULT_THEME },
  selectedId: null,
};

type Phase = "gate" | "loading" | "ready";

export interface SyncStatus {
  /** False when the server can't currently be reached (edits are local-only). */
  online: boolean;
  /** Last sync error message (save/poll), if any. */
  error: string | null;
  /** How many APGs still have work waiting to reach the server. */
  pending: number;
  /** How many pictures are still being downloaded. */
  loadingImages: number;
  /** True until the first successful load from the server in this session. */
  offlineStart: boolean;
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Convenience: the currently selected APG, if any. */
  selected: APG | null;
  sync: SyncStatus;
  /** Kept for compatibility with existing consumers. */
  online: boolean;
  syncError: string | null;
  /** Make sure every picture of these APGs (default: all) is in memory.
   *  Exports call this so a PDF is never generated with missing figures. */
  ensureImagesLoaded: (ids?: string[]) => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

function BootSplash({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
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
        <div>Carregando o acervo compartilhado…</div>
      )}
    </div>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [phase, setPhase] = useState<Phase>(getPassword() ? "loading" : "gate");
  const [online, setOnline] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [loadingImages, setLoadingImages] = useState(0);
  const [bootErr, setBootErr] = useState<string | null>(null);
  const [offlineStart, setOfflineStart] = useState(false);

  // Latest values, readable from timers/intervals without stale closures.
  const latestApgs = useRef<APG[]>(state.apgs);
  latestApgs.current = state.apgs;
  const latestTheme = useRef<ThemeSettings>(state.theme);
  latestTheme.current = state.theme;
  const latestSelected = useRef<string | null>(state.selectedId);
  latestSelected.current = state.selectedId;

  // ---- sync bookkeeping ----------------------------------------------------
  /** id → wire JSON known to be on the server. */
  const baseline = useRef<Map<string, string>>(new Map());
  /** id → the APG object that produced the last diff (identity fast-path). */
  const seen = useRef<Map<string, APG>>(new Map());
  const dirty = useRef<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());
  /** id → when the server last acknowledged a save (poll race guard). */
  const ackAt = useRef<Map<string, number>>(new Map());
  const attempts = useRef<Map<string, number>>(new Map());
  const saveTimers = useRef<Map<string, number>>(new Map());
  /** ids deleted locally whose DELETE has not gone through yet. */
  const pendingDeletes = useRef<Set<string>>(new Set());
  /** "<apgId>|<key>" → rev already uploaded, so a picture is sent only once. */
  const blobSent = useRef<Map<string, string>>(new Map());

  const lastTheme = useRef<string>("");
  const themeDirty = useRef(false);
  const themeTimer = useRef<number>();

  /** True after the first successful load: only then may we push to the server
   *  (an empty in-memory state must never overwrite the real acervo). */
  const canPush = useRef(false);
  /** Same idea for the local mirror: writing before it has been READ would
   *  replace a good snapshot with the empty startup state. */
  const canMirror = useRef(false);
  /** Guards against a second boot (React StrictMode mounts effects twice). */
  const booted = useRef(false);
  const mirrorTimer = useRef<number>();

  const refreshPending = useCallback(() => {
    setPending(dirty.current.size + inFlight.current.size + pendingDeletes.current.size);
  }, []);

  const markOk = useCallback(() => {
    setOnline(true);
    setSyncError(null);
  }, []);

  const markFail = useCallback((e: unknown) => {
    if (e instanceof NetworkError) {
      setOnline(false);
      setSyncError(null);
    } else {
      setOnline(true);
      setSyncError((e as Error).message || "Falha ao sincronizar.");
    }
  }, []);

  // Drop back to the login screen (bad/expired password).
  const toGate = useCallback(() => {
    setPassword(null);
    canPush.current = false;
    booted.current = false;
    baseline.current.clear();
    seen.current.clear();
    dirty.current.clear();
    inFlight.current.clear();
    ackAt.current.clear();
    blobSent.current.clear();
    setPhase("gate");
  }, []);

  // ---- local mirror --------------------------------------------------------
  const writeMirror = useCallback(async () => {
    if (!canMirror.current) return;
    try {
      const snap: Snapshot = {
        v: SNAPSHOT_VERSION,
        at: Date.now(),
        apgs: latestApgs.current.map(toWire),
        theme: latestTheme.current,
        pending: [...dirty.current, ...inFlight.current],
      };
      await idbSet(SNAPSHOT_KEY, snap);
    } catch {
      /* the mirror is a safety net; never let it break the app */
    }
  }, []);

  const scheduleMirror = useCallback(() => {
    if (!canMirror.current) return;
    window.clearTimeout(mirrorTimer.current);
    mirrorTimer.current = window.setTimeout(writeMirror, MIRROR_MS);
  }, [writeMirror]);

  // ---- pictures ------------------------------------------------------------
  /** Which pictures of an APG are referenced but not in memory. */
  const missingOf = useCallback((apg: APG): { key: string; rev: string }[] => {
    const out: { key: string; rev: string }[] = [];
    for (const im of apg.images) {
      if (im.rev && !isDataUrl(im.dataUrl)) out.push({ key: imgKey(im.id), rev: im.rev });
    }
    for (const ex of apg.exercises ?? []) {
      if (ex.imageRev && !isDataUrl(ex.imageDataUrl)) out.push({ key: exKey(ex.id), rev: ex.imageRev });
    }
    return out;
  }, []);

  const hydrateRunning = useRef(false);
  const hydrateWaiters = useRef<(() => void)[]>([]);

  /** Download the pictures the acervo is missing: local cache first (instant,
   *  and the reason this works offline), then the server, selected APG before
   *  the rest. `done` holds the revisions this pass has already resolved (or
   *  given up on), which is what makes the loop terminate — the React state it
   *  dispatches into is only visible on the next render. */
  const hydrate = useCallback(async () => {
    if (hydrateRunning.current) return;
    hydrateRunning.current = true;
    const done = new Set<string>();
    try {
      for (;;) {
        const selId = latestSelected.current;
        const order = [...latestApgs.current].sort((a, b) =>
          a.id === selId ? -1 : b.id === selId ? 1 : 0
        );
        const todo = order
          .map((a) => ({ apg: a, missing: missingOf(a).filter((m) => !done.has(m.rev)) }))
          .filter((t) => t.missing.length > 0);
        setLoadingImages(todo.reduce((n, t) => n + t.missing.length, 0));
        if (todo.length === 0) break;

        // 1. Whatever is already on this machine — instant, and works offline.
        const cached = await cacheRead(todo.flatMap((t) => t.missing.map((m) => m.rev)));
        if (cached.size) {
          for (const rev of cached.keys()) done.add(rev);
          dispatch({ type: "HYDRATE", blobs: cached });
        }
        const remaining = todo
          .map((t) => ({ apg: t.apg, missing: t.missing.filter((m) => !done.has(m.rev)) }))
          .filter((t) => t.missing.length > 0);
        if (remaining.length === 0) continue;

        // 2. Ask the server, one APG at a time and in bounded chunks.
        let progressed = false;
        for (const { apg, missing } of remaining) {
          let keys = missing.map((m) => m.key);
          while (keys.length) {
            const res = await fetchBlobs(apg.id, keys);
            if (res.blobs.length === 0) break;
            const byRev = new Map(res.blobs.map((b) => [b.rev, b.dataUrl]));
            await cacheWrite(res.blobs.map((b) => [b.rev, b.dataUrl] as [string, string]));
            for (const b of res.blobs) {
              blobSent.current.set(`${apg.id}|${b.key}`, b.rev);
              done.add(b.rev);
            }
            dispatch({ type: "HYDRATE", blobs: byRev });
            progressed = true;
            keys = res.next;
          }
          // Anything the server didn't hand over: stop asking within this pass.
          for (const m of missing) done.add(m.rev);
        }
        if (!progressed) break;
      }
      markOk();
    } catch (e) {
      if (e instanceof AuthError) toGate();
      else markFail(e);
    } finally {
      setLoadingImages(0);
      hydrateRunning.current = false;
      const waiters = hydrateWaiters.current;
      hydrateWaiters.current = [];
      waiters.forEach((w) => w());
    }
  }, [missingOf, markOk, markFail, toGate]);

  const ensureImagesLoaded = useCallback(
    async (ids?: string[]) => {
      const want = () =>
        latestApgs.current.filter((a) => (ids ? ids.includes(a.id) : true));
      if (want().every(isHydrated)) return;
      await new Promise<void>((resolve) => {
        hydrateWaiters.current.push(resolve);
        hydrate();
      });
      const missing = want().filter((a) => !isHydrated(a));
      if (missing.length) {
        const names = missing
          .slice(0, 3)
          .map((a) => `P${a.periodo}·APG${a.numero}`)
          .join(", ");
        throw new Error(
          `Algumas imagens ainda não foram baixadas (${names}${
            missing.length > 3 ? "…" : ""
          }). Verifique a conexão e tente de novo.`
        );
      }
    },
    [hydrate]
  );

  // ---- push one APG --------------------------------------------------------
  const pushApg = useCallback(
    async (id: string) => {
      if (!canPush.current || inFlight.current.has(id)) return;
      const apg = latestApgs.current.find((a) => a.id === id);
      if (!apg) {
        dirty.current.delete(id);
        refreshPending();
        return;
      }
      inFlight.current.add(id);
      refreshPending();
      const json = wireJson(apg);
      try {
        // Pictures first, one small request each, so the APG document is never
        // written referencing something the server doesn't have yet.
        for (const b of collectBlobs(apg)) {
          const k = `${b.apgId}|${b.key}`;
          if (blobSent.current.get(k) === b.rev) continue;
          await saveBlob(b);
          blobSent.current.set(k, b.rev);
          cacheWrite([[b.rev, b.dataUrl]]);
        }
        await saveApg(apg);
        baseline.current.set(id, json);
        ackAt.current.set(id, Date.now());
        attempts.current.delete(id);
        // Only clear "dirty" if nothing changed again while we were saving.
        const now = latestApgs.current.find((a) => a.id === id);
        if (now && wireJson(now) === json) dirty.current.delete(id);
        markOk();
      } catch (e) {
        if (e instanceof AuthError) {
          toGate();
        } else {
          markFail(e);
          const n = (attempts.current.get(id) ?? 0) + 1;
          attempts.current.set(id, n);
          const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (n - 1));
          window.clearTimeout(saveTimers.current.get(id));
          saveTimers.current.set(
            id,
            window.setTimeout(() => {
              saveTimers.current.delete(id);
              pushApg(id);
            }, delay)
          );
        }
      } finally {
        inFlight.current.delete(id);
        refreshPending();
        scheduleMirror();
      }
    },
    [markOk, markFail, toGate, refreshPending, scheduleMirror]
  );

  const scheduleSave = useCallback(
    (id: string, delay = SAVE_DEBOUNCE_MS) => {
      window.clearTimeout(saveTimers.current.get(id));
      saveTimers.current.set(
        id,
        window.setTimeout(() => {
          saveTimers.current.delete(id);
          pushApg(id);
        }, delay)
      );
    },
    [pushApg]
  );

  const pushDelete = useCallback(
    async (id: string) => {
      try {
        await deleteApgRemote(id);
        pendingDeletes.current.delete(id);
        markOk();
      } catch (e) {
        if (e instanceof AuthError) toGate();
        else markFail(e); // stays queued; the sweep retries it
      } finally {
        refreshPending();
      }
    },
    [markOk, markFail, toGate, refreshPending]
  );

  // ---- detect local changes and queue them ---------------------------------
  useEffect(() => {
    const current = state.apgs;
    const curIds = new Set(current.map((a) => a.id));

    // Deletions: was known to the server, now gone locally.
    for (const id of Array.from(baseline.current.keys())) {
      if (!curIds.has(id)) {
        baseline.current.delete(id);
        seen.current.delete(id);
        dirty.current.delete(id);
        attempts.current.delete(id);
        window.clearTimeout(saveTimers.current.get(id));
        saveTimers.current.delete(id);
        pendingDeletes.current.add(id);
        if (canPush.current) pushDelete(id);
      }
    }
    for (const id of Array.from(seen.current.keys())) {
      if (!curIds.has(id)) seen.current.delete(id);
    }

    // Upserts. The identity check keeps this O(1) per keystroke: the reducer
    // only replaces the APG that actually changed.
    for (const a of current) {
      if (seen.current.get(a.id) === a) continue;
      seen.current.set(a.id, a);
      if (baseline.current.get(a.id) !== wireJson(a)) {
        dirty.current.add(a.id);
        attempts.current.delete(a.id);
        if (canPush.current) scheduleSave(a.id);
      }
    }

    refreshPending();
    scheduleMirror();
  }, [state.apgs, scheduleSave, pushDelete, refreshPending, scheduleMirror]);

  // ---- theme ---------------------------------------------------------------
  const pushTheme = useCallback(async () => {
    const json = JSON.stringify(latestTheme.current);
    try {
      await saveTheme(latestTheme.current);
      lastTheme.current = json;
      if (JSON.stringify(latestTheme.current) === json) themeDirty.current = false;
      markOk();
    } catch (e) {
      if (e instanceof AuthError) toGate();
      else {
        markFail(e);
        window.clearTimeout(themeTimer.current);
        themeTimer.current = window.setTimeout(pushTheme, RETRY_BASE_MS * 4);
      }
    }
  }, [markOk, markFail, toGate]);

  useEffect(() => {
    const json = JSON.stringify(state.theme);
    if (json === lastTheme.current) return;
    themeDirty.current = true;
    scheduleMirror();
    if (!canPush.current) return;
    window.clearTimeout(themeTimer.current);
    themeTimer.current = window.setTimeout(pushTheme, SAVE_DEBOUNCE_MS);
  }, [state.theme, pushTheme, scheduleMirror]);

  // ---- merge the server's copy ---------------------------------------------
  /** `startedAt` is when the request left, and is what makes this safe: an APG
   *  whose save was acknowledged after that point is NOT overwritten, because
   *  the response predates it. */
  const mergeRemote = useCallback((remote: RemoteState, startedAt: number) => {
    const local = latestApgs.current;
    const localById = new Map(local.map((a) => [a.id, a]));
    const remoteById = new Map(remote.apgs.map((a) => [a.id, loadedApg(a)]));
    const resultById = new Map<string, APG>();

    for (const [id, rem] of remoteById) {
      // We asked for this one to go and the DELETE hasn't landed yet — the
      // server's copy must not resurrect it.
      if (pendingDeletes.current.has(id)) continue;
      const loc = localById.get(id);
      const busy =
        dirty.current.has(id) ||
        inFlight.current.has(id) ||
        (ackAt.current.get(id) ?? 0) >= startedAt;
      if (busy && loc) {
        resultById.set(id, loc);
        continue;
      }
      // Adopt the server's copy, keeping the pictures we already hold.
      const merged = carryOverBlobs(rem, loc);
      resultById.set(id, merged);
      baseline.current.set(id, wireJson(merged));
      seen.current.set(id, merged);
      for (const im of merged.images) {
        if (im.rev) blobSent.current.set(`${id}|${imgKey(im.id)}`, im.rev);
      }
      for (const ex of merged.exercises ?? []) {
        if (ex.imageRev) blobSent.current.set(`${id}|${exKey(ex.id)}`, ex.imageRev);
      }
    }

    // Local APGs the server doesn't have.
    for (const [id, loc] of localById) {
      if (remoteById.has(id)) continue;
      if (pendingDeletes.current.has(id)) continue; // we asked for it to go
      if (baseline.current.has(id) && !dirty.current.has(id) && !inFlight.current.has(id)) {
        // Existed before, gone from the server ⇒ the peer deleted it.
        baseline.current.delete(id);
        seen.current.delete(id);
      } else {
        // Never saved, or has unsaved work → keep it and make sure it goes up.
        resultById.set(id, loc);
        if (canPush.current && !inFlight.current.has(id)) {
          dirty.current.add(id);
          scheduleSave(id, 0);
        }
      }
    }

    // Preserve local order; append genuinely new ids at the end.
    const orderedIds: string[] = [];
    const placed = new Set<string>();
    for (const a of local) {
      if (resultById.has(a.id)) {
        orderedIds.push(a.id);
        placed.add(a.id);
      }
    }
    for (const id of resultById.keys()) if (!placed.has(id)) orderedIds.push(id);
    const apgs = orderedIds.map((id) => resultById.get(id)!);

    const same =
      apgs.length === local.length && apgs.every((a, i) => a === local[i]);
    if (!same) dispatch({ type: "SET_APGS", apgs });

    // Theme (don't clobber an in-progress local theme edit).
    if (remote.theme && !themeDirty.current) {
      const t = { ...DEFAULT_THEME, ...remote.theme };
      const tj = JSON.stringify(t);
      if (tj !== JSON.stringify(latestTheme.current)) {
        lastTheme.current = tj;
        dispatch({ type: "SET_THEME", patch: t });
      }
    }
    refreshPending();
  }, [scheduleSave, refreshPending]);

  // ---- initial load --------------------------------------------------------
  const boot = useCallback(async () => {
    setBootErr(null);

    // 1. The local mirror comes up first: instant, and it is what makes an
    //    interrupted session (crash, closed tab, dead network) recoverable.
    let hadMirror = false;
    try {
      const snap = await idbGet<Snapshot>(SNAPSHOT_KEY);
      if (snap && snap.v === SNAPSHOT_VERSION && Array.isArray(snap.apgs)) {
        const apgs = snap.apgs.map(loadedApg);
        const theme = { ...DEFAULT_THEME, ...(snap.theme ?? {}) };
        for (const a of apgs) {
          seen.current.set(a.id, a);
          // Anything unsaved when the snapshot was written stays unsaved now.
          if (!snap.pending?.includes(a.id)) baseline.current.set(a.id, wireJson(a));
          else dirty.current.add(a.id);
        }
        lastTheme.current = JSON.stringify(theme);
        dispatch({
          type: "LOAD",
          state: { apgs, theme, selectedId: apgs[0]?.id ?? null },
        });
        hadMirror = apgs.length > 0;
        refreshPending();
      }
    } catch {
      /* no usable mirror — fall through to the server */
    }
    // Read first, write after: from here on every edit is mirrored locally.
    canMirror.current = true;

    // 2. Then the server, which is the source of truth.
    const startedAt = Date.now();
    try {
      const remote = await fetchState();
      mergeRemote(remote, startedAt);
      canPush.current = true;
      setOfflineStart(false);
      markOk();
      setPhase("ready");
      // Flush anything the mirror said was still pending.
      for (const id of Array.from(dirty.current)) scheduleSave(id, 0);
      for (const id of Array.from(pendingDeletes.current)) pushDelete(id);
      if (themeDirty.current) pushTheme();
      hydrate();
    } catch (e) {
      if (e instanceof AuthError) {
        toGate();
        return;
      }
      if (hadMirror) {
        // We have the work in front of us — let the user keep going offline.
        setOfflineStart(true);
        setOnline(false);
        setPhase("ready");
        hydrate(); // the local cache still has the pictures
        return;
      }
      setBootErr((e as Error).message || "Falha de conexão.");
    }
  }, [
    mergeRemote,
    markOk,
    toGate,
    hydrate,
    scheduleSave,
    pushDelete,
    pushTheme,
    refreshPending,
  ]);

  useEffect(() => {
    if (phase !== "loading" || booted.current) return;
    booted.current = true;
    boot();
  }, [phase, boot]);

  // ---- poll ----------------------------------------------------------------
  useEffect(() => {
    if (phase !== "ready") return;
    let busy = false;
    const iv = window.setInterval(async () => {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      const startedAt = Date.now();
      try {
        const remote = await fetchState();
        if (!canPush.current) {
          // First contact after starting offline: adopt the server, then push
          // everything we were holding.
          canPush.current = true;
          setOfflineStart(false);
        }
        mergeRemote(remote, startedAt);
        markOk();
        hydrate();
      } catch (e) {
        if (e instanceof AuthError) toGate();
        else if (e instanceof NetworkError) setOnline(false);
        else markFail(e);
      } finally {
        busy = false;
      }
    }, POLL_MS);
    return () => window.clearInterval(iv);
  }, [phase, mergeRemote, toGate, markOk, markFail, hydrate]);

  // ---- sweep: never let unsaved work sit there -----------------------------
  useEffect(() => {
    if (phase !== "ready") return;
    const iv = window.setInterval(() => {
      if (!canPush.current) return;
      for (const id of dirty.current) {
        if (inFlight.current.has(id) || saveTimers.current.has(id)) continue;
        pushApg(id);
      }
      for (const id of pendingDeletes.current) pushDelete(id);
      if (themeDirty.current && !themeTimer.current) pushTheme();
    }, SWEEP_MS);
    return () => window.clearInterval(iv);
  }, [phase, pushApg, pushDelete, pushTheme]);

  // ---- leaving the page ----------------------------------------------------
  useEffect(() => {
    const flushAll = () => {
      for (const [id, t] of saveTimers.current) {
        window.clearTimeout(t);
        saveTimers.current.delete(id);
        pushApg(id);
      }
      window.clearTimeout(mirrorTimer.current);
      writeMirror();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      flushAll();
      if (dirty.current.size || inFlight.current.size || pendingDeletes.current.size) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const onOnline = () => {
      setOnline(true);
      for (const id of dirty.current) scheduleSave(id, 0);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushAll);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushAll);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
    };
  }, [pushApg, writeMirror, scheduleSave]);

  // ---- keep the local picture cache bounded --------------------------------
  useEffect(() => {
    if (phase !== "ready") return;
    const t = window.setTimeout(() => {
      const keep = new Set<string>();
      for (const a of latestApgs.current) for (const r of referencedRevs(a)) keep.add(r);
      if (keep.size) blobPrune(keep).catch(() => {});
    }, 60000);
    return () => window.clearTimeout(t);
  }, [phase]);

  const selected = state.apgs.find((a) => a.id === state.selectedId) ?? null;

  const sync = useMemo<SyncStatus>(
    () => ({ online, error: syncError, pending, loadingImages, offlineStart }),
    [online, syncError, pending, loadingImages, offlineStart]
  );

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, selected, sync, online, syncError, ensureImagesLoaded }),
    [state, selected, sync, online, syncError, ensureImagesLoaded]
  );

  if (phase === "gate") {
    return <LoginGate onAuthed={() => setPhase("loading")} />;
  }
  if (phase === "loading") {
    return <BootSplash error={bootErr} onRetry={bootErr ? boot : undefined} />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { uid };
