// /api/apgs
//   PUT    — upsert one APG (body = the APG) or many (body = { apgs: APG[] }).
//   DELETE — remove one APG by id (?id=<id>) together with its pictures.
//
// The APG id becomes the Mongo `_id`; `updatedAt` is stamped server-side.
// Pictures never travel with the APG: any inline data URL that still reaches
// this endpoint (an old tab, an imported backup file) is split out into the
// `blobs` collection so the document always stays small and the write always
// succeeds.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import { blobId, referencedKeys, splitApg } from "./_lib/blobs.js";
import { SPLIT_FLAG, ensureSplit } from "./_lib/migrate.js";

/** Grace period before an unreferenced blob is collected. A picture uploaded a
 *  moment ago may belong to an APG whose save is still on its way. */
const ORPHAN_GRACE_MS = 5 * 60 * 1000;

/**
 * Fill in the `rev` of a picture the incoming payload doesn't carry, from what
 * is already stored. A client that has not loaded an APG's pictures yet still
 * sends the complete metadata list, so this is only a safety net for older
 * tabs — without it, saving could orphan a picture that is still referenced.
 */
function preserveRevs(incoming: any, existing: any): any {
  if (!existing) return incoming;
  const prev = new Map<string, string>();
  for (const im of Array.isArray(existing.images) ? existing.images : []) {
    if (im?.id && im?.rev) prev.set(String(im.id), String(im.rev));
  }
  if (prev.size === 0) return incoming;
  return {
    ...incoming,
    images: (Array.isArray(incoming.images) ? incoming.images : []).map((im: any) =>
      im?.rev || im?.dataUrl ? im : { ...im, rev: prev.get(String(im?.id)) ?? "" }
    ),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  try {
    const db = await getDb();
    const col = db.collection<any>("apgs");
    const blobs = db.collection<any>("blobs");

    if (req.method === "PUT") {
      const body: any = req.body ?? {};
      const list: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body.apgs)
        ? body.apgs
        : [body];
      const valid = list.filter((a) => a && a.id);
      if (valid.length === 0) {
        res.status(400).json({ error: "Nenhuma APG válida no corpo da requisição." });
        return;
      }
      const now = Date.now();

      for (const incoming of valid) {
        const id = String(incoming.id);
        // Convert a legacy document before overwriting it, so its inline
        // pictures are safely in `blobs` first.
        const existing = await ensureSplit(col, blobs, id);
        const { doc, blobs: inline } = splitApg(preserveRevs(incoming, existing));

        // Any picture that still came inline gets its own document.
        if (inline.length) {
          await blobs.bulkWrite(
            inline.map((b) => ({
              updateOne: {
                filter: { _id: blobId(id, b.key) },
                update: {
                  $set: {
                    apgId: id,
                    key: b.key,
                    rev: b.rev,
                    dataUrl: b.dataUrl,
                    bytes: b.dataUrl.length,
                    updatedAt: now,
                  },
                },
                upsert: true,
              },
            })),
            { ordered: false }
          );
        }

        const { id: _drop, _id, ...rest } = doc;
        await col.updateOne(
          { _id: id as any },
          { $set: { ...rest, updatedAt: now, [SPLIT_FLAG]: true } },
          { upsert: true }
        );

        // Collect pictures the APG no longer references (removed images, deleted
        // exercises). Recent uploads are spared — their APG save may be in
        // flight from another tab.
        const keep = referencedKeys(doc);
        await blobs.deleteMany({
          apgId: id,
          key: { $nin: Array.from(keep) },
          updatedAt: { $lt: now - ORPHAN_GRACE_MS },
        });
      }

      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const raw = req.query.id;
      const id = Array.isArray(raw) ? raw[0] : raw;
      if (!id) {
        res.status(400).json({ error: "id ausente." });
        return;
      }
      await col.deleteOne({ _id: id as any });
      await blobs.deleteMany({ apgId: id });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
