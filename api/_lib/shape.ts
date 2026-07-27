// Maps between the Mongo document shape and the client APG shape.
// In Mongo the APG id is stored as `_id` (natural primary key). The client works
// with `id`. We also strip the server-managed `updatedAt` so the object the
// client reads back is byte-identical to what it saved (the store diffs on JSON).

export function docToApg(doc: any) {
  if (!doc) return doc;
  const { _id, updatedAt, ...rest } = doc;
  return { id: _id, ...rest };
}

export function docToTheme(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}
