// Image storage, split OUT of the APG document.
//
// Every picture used to live base64-inline inside the APG document. That broke
// in two hard, silent ways:
//   - Vercel caps a serverless request/response body at 4.5 MB, so saving (or
//     even loading) an APG with a handful of photos failed outright;
//   - MongoDB caps a single document at 16 MB, so the write was rejected.
// Either way the picture never reached the database and was lost on reload.
//
// So the APG document now carries only image METADATA and each picture lives in
// its own document in the `blobs` collection — no size cliff, and a save is a
// few small writes instead of one huge one.
//
//   blobs._id = "<apgId>|<key>"   key = "img:<imageId>" | "ex:<exerciseId>"

/** Blob key for an image of the APG body. */
export function imgKey(imageId: string): string {
  return `img:${imageId}`;
}

/** Blob key for the picture attached to an exercise. */
export function exKey(exerciseId: string): string {
  return `ex:${exerciseId}`;
}

export function blobId(apgId: string, key: string): string {
  return `${apgId}|${key}`;
}

/** True for a base64/data URL payload worth storing outside the document. */
export function isInline(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("data:");
}

/**
 * Content revision of a blob. Must produce the same value as the client's
 * `revOf` (src/state/blobs.ts) so a cached picture is not re-downloaded after a
 * server-side migration. Plain djb2 over the string, in base36.
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

export interface ExtractedBlob {
  key: string;
  rev: string;
  dataUrl: string;
}

export interface SplitApg {
  /** The APG document with every data URL replaced by a `rev` marker. */
  doc: any;
  /** The pictures pulled out of it. */
  blobs: ExtractedBlob[];
  /** True when something was actually inline (i.e. a legacy document). */
  hadInline: boolean;
}

/**
 * Split an APG (client or legacy DB shape) into a slim document plus its blobs.
 * Metadata (id, caption, width, height, rev) always stays on the document, so
 * the reference list is complete even when the pictures aren't loaded.
 */
export function splitApg(apg: any): SplitApg {
  const blobs: ExtractedBlob[] = [];
  let hadInline = false;

  const images = (Array.isArray(apg?.images) ? apg.images : []).map((im: any) => {
    const { dataUrl, ...meta } = im ?? {};
    let rev = typeof im?.rev === "string" ? im.rev : "";
    if (isInline(dataUrl)) {
      hadInline = true;
      rev = rev || revOf(dataUrl);
      blobs.push({ key: imgKey(String(im.id)), rev, dataUrl });
    }
    return { ...meta, rev };
  });

  const exercises = (Array.isArray(apg?.exercises) ? apg.exercises : []).map((ex: any) => {
    const { imageDataUrl, ...rest } = ex ?? {};
    let rev = typeof ex?.imageRev === "string" ? ex.imageRev : "";
    if (isInline(imageDataUrl)) {
      hadInline = true;
      rev = rev || revOf(imageDataUrl);
      blobs.push({ key: exKey(String(ex.id)), rev, dataUrl: imageDataUrl });
    }
    // An exercise with no picture must not keep a stale rev around.
    if (!rev) delete rest.imageRev;
    else rest.imageRev = rev;
    return rest;
  });

  return { doc: { ...apg, images, exercises }, blobs, hadInline };
}

/** Every blob key an APG document still references (used to prune orphans). */
export function referencedKeys(apg: any): Set<string> {
  const keys = new Set<string>();
  for (const im of Array.isArray(apg?.images) ? apg.images : []) {
    if (im?.id) keys.add(imgKey(String(im.id)));
  }
  for (const ex of Array.isArray(apg?.exercises) ? apg.exercises : []) {
    if (ex?.id && ex?.imageRev) keys.add(exKey(String(ex.id)));
  }
  return keys;
}
