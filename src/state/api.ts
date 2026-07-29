// Client-side data layer: talks to the Vercel serverless API (/api/*) backed by
// MongoDB Atlas. Replaces the old local IndexedDB/localStorage persistence so the
// acervo is SHARED — two people edit the same data from different machines.
//
// Auth is a single shared password sent in the `x-app-password` header. It's kept
// in memory and mirrored to sessionStorage so a page reload within the same tab
// stays logged in (it's cleared when the tab closes — it is NOT the old data-in-
// localStorage that this migration removed).
//
// TRANSFER MODEL — why this file is not just `fetch("/api/state")`:
// an APG carries its images inline as base64 data URLs, and a Vercel function
// can neither return nor receive more than ~4.5 MB. Sending the whole acervo in
// one response therefore started failing with a 500 as soon as enough images
// were added. So the transfer is split into three sizes:
//
//   1. the manifest  (/api/state?manifest=1) — id + updatedAt per APG, a few
//      hundred bytes; this is what the poll asks for every few seconds;
//   2. the APG text  (/api/apgs?ids=…)       — everything except image data,
//      batched and trimmed to a safe response size;
//   3. the images    (/api/assets?keys=…)    — one document per image, fetched
//      a few at a time and cached here by `sig` (content signature), so an
//      unchanged image is downloaded once per session.
//
// The store above this layer keeps working with whole APG objects: images are
// re-attached on the way in and split off on the way out.

import { APG, APGImage, Exercise, ThemeSettings } from "./types";

const PW_KEY = "domineaqui.pw";

let password: string | null = (() => {
  try {
    return sessionStorage.getItem(PW_KEY);
  } catch {
    return null;
  }
})();

export function getPassword(): string | null {
  return password;
}

export function setPassword(pw: string | null): void {
  password = pw;
  try {
    if (pw) sessionStorage.setItem(PW_KEY, pw);
    else sessionStorage.removeItem(PW_KEY);
  } catch {
    /* sessionStorage blocked — password still lives in memory */
  }
}

/** Thrown on 401 so callers can drop back to the login screen. */
export class AuthError extends Error {}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-app-password": password ?? "",
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) throw new AuthError("Senha incorreta ou sessão expirada.");
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* non-JSON error body (e.g. a platform-level error page) */
    }
    throw new Error(msg);
  }
  return res;
}

// --- Image (asset) plumbing -------------------------------------------------

/** An image's key inside its APG. */
function imageKey(imageId: string): string {
  return `img:${imageId}`;
}
function exerciseKey(exerciseId: string): string {
  return `ex:${exerciseId}`;
}

/** Content signature of a data URL: length + FNV-1a hash. Two different images
 *  practically never collide, and an unchanged image always maps to the same
 *  signature — which is what makes caching and "did this image change?" work. */
function computeSig(dataUrl: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < dataUrl.length; i++) {
    h ^= dataUrl.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${dataUrl.length.toString(36)}-${(h >>> 0).toString(36)}`;
}

// Hashing a multi-MB string is fast but not free; the same data URL is hashed
// once per session.
const sigCache = new Map<string, string>();
function sigOf(dataUrl: string): string {
  let sig = sigCache.get(dataUrl);
  if (!sig) {
    sig = computeSig(dataUrl);
    sigCache.set(dataUrl, sig);
  }
  return sig;
}

/** sig → data URL. Images are immutable for a given signature, so this never
 *  goes stale; it is what keeps the poll from re-downloading images. */
const assetCache = new Map<string, string>();

/** "<apgId>|<key>" → signature currently stored on the server, so a save only
 *  uploads images that actually changed. */
const savedSigs = new Map<string, string>();

function ref(apgId: string, key: string): string {
  return `${apgId}|${key}`;
}

// --- Wire shapes ------------------------------------------------------------

interface WireImage {
  id: string;
  caption?: string;
  width: number;
  height: number;
  sig?: string | null;
}

type WireExercise = Omit<Exercise, "imageDataUrl"> & { imageSig?: string | null };

interface WireApg {
  id: string;
  periodo: number;
  numero: number;
  titulo: string;
  objetivosRaw: string;
  conteudoRaw: string;
  images: WireImage[];
  exercises: WireExercise[];
}

export interface ManifestEntry {
  id: string;
  updatedAt: number;
}

export interface Manifest {
  apgs: ManifestEntry[];
  theme: Partial<ThemeSettings> | null;
}

/** Progress of a multi-request load, for the boot splash. */
export interface LoadProgress {
  loaded: number;
  total: number;
}

/** How many images to ask for at once, and how many such requests may be in
 *  flight. Small batches keep every response far below the platform limit. */
const ASSETS_PER_REQUEST = 4;
const ASSET_CONCURRENCY = 3;
const MAX_ASSET_RETRIES = 5;

// --- Reads ------------------------------------------------------------------

/** The acervo's index: which APGs exist and when each last changed. */
export async function fetchManifest(): Promise<Manifest> {
  const res = await api("state?manifest=1");
  const j = await res.json();
  return {
    apgs: Array.isArray(j?.apgs)
      ? j.apgs.map((a: any) => ({ id: String(a.id), updatedAt: Number(a.updatedAt) || 0 }))
      : [],
    theme: j?.theme ?? null,
  };
}

/** Fetch the given APGs (text first, then their images) and return them whole. */
export async function fetchApgs(
  ids: string[],
  onProgress?: (p: LoadProgress) => void
): Promise<APG[]> {
  if (ids.length === 0) return [];

  // 1. Text. The server hands back what fits and names what didn't; ids it
  //    returns in neither list no longer exist and simply drop out.
  const wire: WireApg[] = [];
  let pending = [...ids];
  while (pending.length > 0) {
    const batch = pending.slice(0, 25);
    const rest = pending.slice(25);
    const res = await api(`apgs?ids=${batch.map(encodeURIComponent).join(",")}`);
    const j = await res.json();
    wire.push(...(Array.isArray(j?.apgs) ? j.apgs : []));
    const remaining: string[] = Array.isArray(j?.remaining) ? j.remaining : [];
    pending = [...remaining, ...rest];
  }

  // 2. Images we don't already hold, in small batches.
  const needed: { apgId: string; key: string; sig: string }[] = [];
  const seen = new Set<string>();
  for (const a of wire) {
    for (const im of a.images ?? []) {
      if (!im.sig || assetCache.has(im.sig)) continue;
      const r = ref(a.id, imageKey(im.id));
      if (seen.has(r)) continue;
      seen.add(r);
      needed.push({ apgId: a.id, key: imageKey(im.id), sig: im.sig });
    }
    for (const ex of a.exercises ?? []) {
      if (!ex.imageSig || assetCache.has(ex.imageSig)) continue;
      const r = ref(a.id, exerciseKey(ex.id));
      if (seen.has(r)) continue;
      seen.add(r);
      needed.push({ apgId: a.id, key: exerciseKey(ex.id), sig: ex.imageSig });
    }
  }

  const total = needed.length;
  let loaded = 0;
  onProgress?.({ loaded, total });

  // Work queue of image references. `solo` marks one that must be requested on
  // its own, because it was part of a batch that failed.
  interface Job {
    key: string;
    solo: boolean;
  }
  const queue: Job[] = needed.map((n) => ({ key: ref(n.apgId, n.key), solo: false }));
  const attempts = new Map<string, number>();

  /** Put a reference back in line, unless it has had its chances — one image we
   *  can't read must not fail the whole load; the APG just opens without it. */
  function requeue(key: string, solo: boolean): void {
    const n = (attempts.get(key) ?? 0) + 1;
    attempts.set(key, n);
    if (n <= MAX_ASSET_RETRIES) {
      queue.push({ key, solo });
    } else {
      loaded++;
      onProgress?.({ loaded, total });
    }
  }

  /** Next request's worth of work: one job, plus more only if none is `solo`. */
  function nextBatch(): Job[] {
    const first = queue.shift();
    if (!first) return [];
    const batch = [first];
    if (!first.solo) {
      while (batch.length < ASSETS_PER_REQUEST && queue.length > 0 && !queue[0].solo) {
        batch.push(queue.shift()!);
      }
    }
    return batch;
  }

  async function drain(): Promise<void> {
    for (;;) {
      const batch = nextBatch();
      if (batch.length === 0) return;
      const keys = batch.map((b) => b.key);

      let j: any;
      try {
        const res = await api(`assets?keys=${keys.map(encodeURIComponent).join(",")}`);
        j = await res.json();
      } catch (err) {
        if (err instanceof AuthError) throw err;
        if (batch.length > 1) {
          // Retry them one by one, so a single unreadable image can't take its
          // neighbours down with it.
          for (const k of keys) queue.push({ key: k, solo: true });
        } else {
          requeue(keys[0], true);
        }
        continue;
      }

      for (const a of j?.assets ?? []) {
        if (a?.sig && typeof a.dataUrl === "string") assetCache.set(a.sig, a.dataUrl);
        if (a?.apgId && a?.key) savedSigs.set(ref(a.apgId, a.key), a.sig ?? "");
        loaded++;
      }
      onProgress?.({ loaded, total });
      // Whatever didn't fit in the response comes back for another round.
      for (const r of j?.remaining ?? []) requeue(r, batch.length === 1);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ASSET_CONCURRENCY, Math.max(1, queue.length)) }, drain)
  );

  return wire.map(hydrate);
}

/** Re-attach cached image data to a wire APG. */
function hydrate(a: WireApg): APG {
  const images: APGImage[] = (a.images ?? []).map((im) => {
    if (im.sig) savedSigs.set(ref(a.id, imageKey(im.id)), im.sig);
    return {
      id: im.id,
      dataUrl: (im.sig && assetCache.get(im.sig)) || "",
      caption: im.caption,
      width: im.width,
      height: im.height,
    };
  });
  const exercises: Exercise[] = (a.exercises ?? []).map((ex) => {
    const { imageSig, ...rest } = ex;
    if (imageSig) savedSigs.set(ref(a.id, exerciseKey(ex.id)), imageSig);
    const dataUrl = imageSig ? assetCache.get(imageSig) : undefined;
    return dataUrl ? { ...rest, imageDataUrl: dataUrl } : (rest as Exercise);
  });
  return {
    id: a.id,
    periodo: a.periodo,
    numero: a.numero,
    titulo: a.titulo,
    objetivosRaw: a.objetivosRaw,
    conteudoRaw: a.conteudoRaw,
    images,
    exercises,
  };
}

/** Validate a candidate password; on success it becomes the active password. */
export async function login(pw: string): Promise<boolean> {
  const res = await fetch("/api/state?manifest=1", { headers: { "x-app-password": pw } });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  setPassword(pw);
  return true;
}

// --- Writes -----------------------------------------------------------------

/** Split an APG into a small text document plus its images. */
function dehydrate(apg: APG): {
  doc: WireApg;
  assets: { key: string; sig: string; dataUrl: string }[];
} {
  const assets: { key: string; sig: string; dataUrl: string }[] = [];

  const images: WireImage[] = apg.images.map((im) => {
    const base = { id: im.id, caption: im.caption, width: im.width, height: im.height };
    if (!im.dataUrl) {
      // The image didn't load this session (a failed asset request). Keep
      // pointing at the stored one instead of orphaning it on this save.
      const known = savedSigs.get(ref(apg.id, imageKey(im.id)));
      return known ? { ...base, sig: known } : base;
    }
    const sig = sigOf(im.dataUrl);
    assets.push({ key: imageKey(im.id), sig, dataUrl: im.dataUrl });
    return { ...base, sig };
  });

  const exercises: WireExercise[] = apg.exercises.map((ex) => {
    const { imageDataUrl, ...rest } = ex;
    if (!imageDataUrl) {
      const known = savedSigs.get(ref(apg.id, exerciseKey(ex.id)));
      return { ...rest, imageSig: known ?? null };
    }
    const sig = sigOf(imageDataUrl);
    assets.push({ key: exerciseKey(ex.id), sig, dataUrl: imageDataUrl });
    return { ...rest, imageSig: sig };
  });

  return {
    doc: {
      id: apg.id,
      periodo: apg.periodo,
      numero: apg.numero,
      titulo: apg.titulo,
      objetivosRaw: apg.objetivosRaw,
      conteudoRaw: apg.conteudoRaw,
      images,
      exercises,
    },
    assets,
  };
}

/** Upsert a single APG: changed images first (one request each), then the text.
 *  Returns the server's new `updatedAt` so the poll can tell our own write from
 *  a peer's. */
export async function saveApg(apg: APG): Promise<number> {
  const { doc, assets } = dehydrate(apg);

  for (const a of assets) {
    const r = ref(apg.id, a.key);
    if (savedSigs.get(r) === a.sig) continue; // unchanged — already on the server
    await api("assets", {
      method: "PUT",
      body: JSON.stringify({ apgId: apg.id, key: a.key, sig: a.sig, dataUrl: a.dataUrl }),
    });
    savedSigs.set(r, a.sig);
    assetCache.set(a.sig, a.dataUrl);
  }

  const res = await api("apgs", { method: "PUT", body: JSON.stringify(doc) });
  const j = await res.json().catch(() => ({}));

  // Forget images this APG no longer references (the server drops them too).
  // Taken from the saved document, not from `assets`: an image that is still
  // referenced but wasn't re-uploaded must keep its entry.
  const live = new Set<string>();
  for (const im of doc.images) if (im.sig) live.add(ref(apg.id, imageKey(im.id)));
  for (const ex of doc.exercises) if (ex.imageSig) live.add(ref(apg.id, exerciseKey(ex.id)));
  for (const key of Array.from(savedSigs.keys())) {
    if (key.startsWith(`${apg.id}|`) && !live.has(key)) savedSigs.delete(key);
  }

  return Number(j?.updatedAt) || Date.now();
}

/** Upsert many APGs (used by import). Saved one by one so no single request
 *  carries more than one APG's images. */
export async function saveApgs(apgs: APG[]): Promise<void> {
  for (const apg of apgs) await saveApg(apg);
}

/** Delete a single APG by id. */
export async function deleteApgRemote(id: string): Promise<void> {
  await api(`apgs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  for (const key of Array.from(savedSigs.keys())) {
    if (key.startsWith(`${id}|`)) savedSigs.delete(key);
  }
}

/** Upsert the shared theme. */
export async function saveTheme(theme: ThemeSettings): Promise<void> {
  await api("theme", { method: "PUT", body: JSON.stringify(theme) });
}
