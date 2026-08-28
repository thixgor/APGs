// Pictures, separated from the APG they belong to.
//
// WHY: an APG used to travel to the server with every picture base64-inlined.
// That one request had to fit Vercel's 4.5 MB body cap and the resulting
// document had to fit MongoDB's 16 MB cap. A few photos blew through both, the
// save was rejected, and the images were gone on the next reload. Now:
//
//   • the APG document carries only metadata (id, caption, size, rev);
//   • each picture is its own small document, uploaded and downloaded on its own;
//   • every picture is also cached locally in IndexedDB by CONTENT revision, so
//     it is downloaded once per machine and survives being offline.
//
// The in-memory APG still carries `dataUrl`, so the PDF/HTML/export pipelines
// are untouched — only the wire and disk formats changed.

import { APG, APGImage, Exercise } from "./types";
import { blobGetMany, blobPutMany } from "./db";

/** Key identifying a picture inside one APG. Mirrors api/_lib/blobs.ts. */
export function imgKey(imageId: string): string {
  return `img:${imageId}`;
}
export function exKey(exerciseId: string): string {
  return `ex:${exerciseId}`;
}

/**
 * Content revision of a picture. MUST stay identical to `revOf` in
 * api/_lib/blobs.ts — a mismatch only costs a redundant download, but keeping
 * them in step means a server-side migration lands straight in the local cache.
 */
export function revOf(s: string): string {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 33) ^ (c + i);
  }
  const a = (h1 >>> 0).toString(36);
  const b = (h2 >>> 0).toString(36);
  return `${a}${b}${s.length.toString(36)}`;
}

/** True when the value is an actual embedded picture. */
export function isDataUrl(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("data:");
}

// ---------------------------------------------------------------------------
// Wire shape
// ---------------------------------------------------------------------------

/** One picture as it is stored/transferred on its own. */
export interface BlobRef {
  apgId: string;
  key: string;
  rev: string;
  dataUrl: string;
}

/**
 * The APG as it travels to the server: same object, minus every picture.
 * Key order is fixed so `JSON.stringify` can be used to detect real changes.
 */
export function toWire(apg: APG): any {
  return {
    id: apg.id,
    periodo: apg.periodo,
    numero: apg.numero,
    titulo: apg.titulo,
    objetivosRaw: apg.objetivosRaw,
    conteudoRaw: apg.conteudoRaw,
    images: apg.images.map((im) => ({
      id: im.id,
      caption: im.caption ?? "",
      width: im.width,
      height: im.height,
      rev: im.rev ?? "",
    })),
    exercises: (apg.exercises ?? []).map((ex) => {
      const { imageDataUrl, ...rest } = ex;
      return { ...rest, imageRev: ex.imageRev ?? "" };
    }),
  };
}

/** Stable JSON of the wire shape — the unit of "has this APG changed?". */
export function wireJson(apg: APG): string {
  return JSON.stringify(toWire(apg));
}

/** Every picture this APG currently holds in memory, ready to be uploaded. */
export function collectBlobs(apg: APG): BlobRef[] {
  const out: BlobRef[] = [];
  for (const im of apg.images) {
    if (isDataUrl(im.dataUrl) && im.rev) {
      out.push({ apgId: apg.id, key: imgKey(im.id), rev: im.rev, dataUrl: im.dataUrl });
    }
  }
  for (const ex of apg.exercises ?? []) {
    if (isDataUrl(ex.imageDataUrl) && ex.imageRev) {
      out.push({ apgId: apg.id, key: exKey(ex.id), rev: ex.imageRev, dataUrl: ex.imageDataUrl });
    }
  }
  return out;
}

/** Revisions an APG references, whether or not the picture is loaded. */
export function referencedRevs(apg: APG): string[] {
  const revs: string[] = [];
  for (const im of apg.images) if (im.rev) revs.push(im.rev);
  for (const ex of apg.exercises ?? []) if (ex.imageRev) revs.push(ex.imageRev);
  return revs;
}

/** True when some picture this APG references is not in memory yet. */
export function isHydrated(apg: APG): boolean {
  for (const im of apg.images) if (im.rev && !isDataUrl(im.dataUrl)) return false;
  for (const ex of apg.exercises ?? []) if (ex.imageRev && !isDataUrl(ex.imageDataUrl)) return false;
  return true;
}

/** Give every picture a revision (used when an APG is imported or created). */
export function withRevs(apg: APG): APG {
  let changed = false;
  const images = apg.images.map((im) => {
    if (!isDataUrl(im.dataUrl) || im.rev) return im;
    changed = true;
    return { ...im, rev: revOf(im.dataUrl) };
  });
  const exercises = (apg.exercises ?? []).map((ex) => {
    if (!isDataUrl(ex.imageDataUrl) || ex.imageRev) return ex;
    changed = true;
    return { ...ex, imageRev: revOf(ex.imageDataUrl) };
  });
  return changed ? { ...apg, images, exercises } : apg;
}

// ---------------------------------------------------------------------------
// Applying downloaded pictures back onto an APG
// ---------------------------------------------------------------------------

/**
 * Fill in the pictures an APG is missing from `byRev`. Returns the same object
 * when nothing changed, so React can skip the re-render.
 */
export function applyBlobs(apg: APG, byRev: Map<string, string>): APG {
  if (byRev.size === 0) return apg;
  let changed = false;

  const images: APGImage[] = apg.images.map((im) => {
    if (!im.rev || isDataUrl(im.dataUrl)) return im;
    const data = byRev.get(im.rev);
    if (!data) return im;
    changed = true;
    return { ...im, dataUrl: data };
  });

  const exercises: Exercise[] = (apg.exercises ?? []).map((ex) => {
    if (!ex.imageRev || isDataUrl(ex.imageDataUrl)) return ex;
    const data = byRev.get(ex.imageRev);
    if (!data) return ex;
    changed = true;
    return { ...ex, imageDataUrl: data };
  });

  return changed ? { ...apg, images, exercises } : apg;
}

/**
 * Carry pictures already in memory over to a copy of the APG that arrived from
 * the server without them (matched by revision, so a picture that actually
 * changed is correctly dropped and re-downloaded).
 */
export function carryOverBlobs(remote: APG, local: APG | undefined): APG {
  if (!local) return remote;
  const byRev = new Map<string, string>();
  for (const im of local.images) if (im.rev && isDataUrl(im.dataUrl)) byRev.set(im.rev, im.dataUrl);
  for (const ex of local.exercises ?? []) {
    if (ex.imageRev && isDataUrl(ex.imageDataUrl)) byRev.set(ex.imageRev, ex.imageDataUrl);
  }
  return applyBlobs(remote, byRev);
}

// ---------------------------------------------------------------------------
// Local cache
// ---------------------------------------------------------------------------

/** Look up revisions in the local picture cache. Never throws. */
export async function cacheRead(revs: string[]): Promise<Map<string, string>> {
  if (revs.length === 0) return new Map();
  try {
    return await blobGetMany(Array.from(new Set(revs)));
  } catch {
    return new Map();
  }
}

/** Store pictures in the local cache. Never throws (quota, private mode…). */
export async function cacheWrite(entries: [string, string][]): Promise<void> {
  if (entries.length === 0) return;
  try {
    await blobPutMany(entries);
  } catch {
    /* the picture is still in memory and on the server */
  }
}
