// /api/apgs
//   GET    — fetch APGs by id (?ids=a,b,c), WITHOUT their image data.
//   PUT    — upsert one APG (body = the APG) or many (body = { apgs: APG[] }).
//   DELETE — remove one APG by id (?id=<id>), with its images.
//
// The APG id becomes the Mongo `_id`; `updatedAt` is stamped server-side.
// Image data URLs never travel through this endpoint — they live in the
// `assets` collection and are fetched/uploaded one by one via /api/assets, so
// no request or response can outgrow Vercel's ~4.5 MB limit. See _lib/shape.ts.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import {
  assetId,
  liteApgStage,
  queryList,
  queryOne,
  takeWithinBudget,
} from "./_lib/shape.js";

/** Split any inline data URL out of an incoming APG into asset documents.
 *  The client already sends APGs pre-split; this is the safety net that also
 *  migrates documents written before the split existed. */
function splitAssets(apg: any): { doc: any; assets: { key: string; sig: string; dataUrl: string }[] } {
  const assets: { key: string; sig: string; dataUrl: string }[] = [];

  const images = (Array.isArray(apg.images) ? apg.images : []).map((im: any) => {
    const { dataUrl, ...rest } = im ?? {};
    if (typeof dataUrl === "string" && dataUrl) {
      const sig = rest.sig || `L${dataUrl.length}`;
      assets.push({ key: `img:${rest.id}`, sig, dataUrl });
      return { ...rest, sig };
    }
    return rest;
  });

  const exercises = (Array.isArray(apg.exercises) ? apg.exercises : []).map((ex: any) => {
    const { imageDataUrl, ...rest } = ex ?? {};
    if (typeof imageDataUrl === "string" && imageDataUrl) {
      const sig = rest.imageSig || `L${imageDataUrl.length}`;
      assets.push({ key: `ex:${rest.id}`, sig, dataUrl: imageDataUrl });
      return { ...rest, imageSig: sig };
    }
    return rest;
  });

  return { doc: { ...apg, images, exercises }, assets };
}

/** Keys an APG still references, so orphaned assets can be dropped. */
function referencedKeys(apg: any): string[] {
  const keys: string[] = [];
  for (const im of Array.isArray(apg.images) ? apg.images : []) {
    if (im?.id) keys.push(`img:${im.id}`);
  }
  for (const ex of Array.isArray(apg.exercises) ? apg.exercises : []) {
    if (ex?.id && (ex.imageSig || ex.imageDataUrl)) keys.push(`ex:${ex.id}`);
  }
  return keys;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const ids = queryList(req.query.ids ?? req.query.id);
      if (ids.length === 0) {
        res.status(200).json({ apgs: [], remaining: [] });
        return;
      }
      const docs = await withDb((db) =>
        db
          .collection<any>("apgs")
          .aggregate([{ $match: { _id: { $in: ids } } }, liteApgStage()])
          .toArray()
      );
      const apgs = docs.map((d: any) => {
        const { _id, ...rest } = d;
        return { id: _id, ...rest };
      });
      // Text-only APGs are small, but a very long conteudoRaw could still add
      // up across a batch — hand back what fits and let the client ask again.
      const { taken, rest } = takeWithinBudget(apgs, (a) => JSON.stringify(a).length);
      res.status(200).json({
        apgs: taken,
        remaining: rest.map((a: any) => a.id),
      });
      return;
    }

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
      await withDb(async (db) => {
        const col = db.collection<any>("apgs");
        const assetCol = db.collection<any>("assets");
        for (const raw of valid) {
          const { doc, assets } = splitAssets(raw);
          const { id, _id, updatedAt, ...rest } = doc;
          for (const a of assets) {
            await assetCol.updateOne(
              { _id: assetId(id, a.key) },
              { $set: { apgId: id, key: a.key, sig: a.sig, dataUrl: a.dataUrl, updatedAt: now } },
              { upsert: true }
            );
          }
          await col.updateOne(
            { _id: id },
            { $set: { ...rest, updatedAt: now } },
            { upsert: true }
          );
          // Drop assets the APG no longer references (deleted images).
          await assetCol.deleteMany({ apgId: id, key: { $nin: referencedKeys(doc) } });
        }
      });
      res.status(200).json({ ok: true, updatedAt: now });
      return;
    }

    if (req.method === "DELETE") {
      const id = queryOne(req.query.id);
      if (!id) {
        res.status(400).json({ error: "id ausente." });
        return;
      }
      await withDb(async (db) => {
        await db.collection<any>("apgs").deleteOne({ _id: id });
        await db.collection<any>("assets").deleteMany({ apgId: id });
      });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
