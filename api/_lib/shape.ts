// Maps between the Mongo document shape and the client APG shape.
// In Mongo the APG id is stored as `_id` (natural primary key). The client works
// with `id`. Server-managed bookkeeping (`updatedAt`, the storage-format flag)
// is stripped so the object the client reads back matches what it saved — the
// store diffs on JSON to decide what still needs syncing.

const SERVER_ONLY = new Set(["_id", "updatedAt", "blobsSplit"]);

export function docToApg(doc: any) {
  if (!doc) return doc;
  const out: any = { id: doc._id };
  for (const k of Object.keys(doc)) {
    if (!SERVER_ONLY.has(k)) out[k] = doc[k];
  }
  return out;
}

export function docToTheme(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}
