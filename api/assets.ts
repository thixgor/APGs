// /api/assets — the heavy part of an APG: image data URLs, one document each.
//
//   GET ?keys=<apgId>|<key>,<apgId>|<key>…  → { assets: [...], remaining: [...] }
//   PUT  body { apgId, key, sig, dataUrl }  → { ok: true }
//
// `key` is `img:<imageId>` or `ex:<exerciseId>`. Assets are requested a few at a
// time and the response is trimmed to a safe size, so a big acervo is fetched in
// many small responses instead of one that trips Vercel's ~4.5 MB limit. The
// client caches them by `sig` (content signature), so an unchanged image is
// downloaded once per session no matter how often the acervo is polled.
//
// APGs saved before images were split out still carry their data URLs inline;
// those are read straight from the APG document as a fallback.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import {
  assetId,
  legacyAssetPipeline,
  queryList,
  takeWithinBudget,
} from "./_lib/shape.js";

/** How many assets one request may resolve, before the byte budget applies. */
const MAX_KEYS_PER_REQUEST = 12;

interface Asset {
  apgId: string;
  key: string;
  sig: string;
  dataUrl: string;
}

function parseRef(ref: string): { apgId: string; key: string } | null {
  const i = ref.indexOf("|");
  if (i <= 0 || i === ref.length - 1) return null;
  return { apgId: ref.slice(0, i), key: ref.slice(i + 1) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const refs = queryList(req.query.keys)
        .map(parseRef)
        .filter((r): r is { apgId: string; key: string } => r !== null);

      const wanted = refs.slice(0, MAX_KEYS_PER_REQUEST);
      const overflow = refs.slice(MAX_KEYS_PER_REQUEST);
      if (wanted.length === 0) {
        res.status(200).json({ assets: [], remaining: [] });
        return;
      }

      const found = await withDb(async (db) => {
        const out: Asset[] = [];
        const docs = await db
          .collection<any>("assets")
          .find({ _id: { $in: wanted.map((w) => assetId(w.apgId, w.key)) } })
          .toArray();
        for (const d of docs) {
          out.push({ apgId: d.apgId, key: d.key, sig: d.sig ?? "", dataUrl: d.dataUrl ?? "" });
        }

        // Anything not in `assets` yet lives inline in its APG document.
        const have = new Set(out.map((a) => assetId(a.apgId, a.key)));
        const missing = wanted.filter((w) => !have.has(assetId(w.apgId, w.key)));
        const byApg = new Map<string, string[]>();
        for (const m of missing) {
          const list = byApg.get(m.apgId) ?? [];
          list.push(m.key);
          byApg.set(m.apgId, list);
        }
        for (const [apgId, keys] of byApg) {
          const imageIds = keys.filter((k) => k.startsWith("img:")).map((k) => k.slice(4));
          const exerciseIds = keys.filter((k) => k.startsWith("ex:")).map((k) => k.slice(3));
          const [doc] = await db
            .collection<any>("apgs")
            .aggregate(legacyAssetPipeline(apgId, imageIds, exerciseIds))
            .toArray();
          if (!doc) continue;
          for (const im of doc.images ?? []) {
            if (!im?.dataUrl) continue;
            out.push({
              apgId,
              key: `img:${im.id}`,
              sig: `L${String(im.dataUrl).length}`,
              dataUrl: im.dataUrl,
            });
          }
          for (const ex of doc.exercises ?? []) {
            if (!ex?.dataUrl) continue;
            out.push({
              apgId,
              key: `ex:${ex.id}`,
              sig: `L${String(ex.dataUrl).length}`,
              dataUrl: ex.dataUrl,
            });
          }
        }
        return out;
      });

      const { taken, rest } = takeWithinBudget(found, (a) => a.dataUrl.length + 200);
      res.status(200).json({
        assets: taken,
        remaining: [
          ...rest.map((a) => `${a.apgId}|${a.key}`),
          ...overflow.map((o) => `${o.apgId}|${o.key}`),
        ],
      });
      return;
    }

    if (req.method === "PUT") {
      const body: any = req.body ?? {};
      const { apgId, key, sig, dataUrl } = body;
      if (!apgId || !key || typeof dataUrl !== "string") {
        res.status(400).json({ error: "Requisição de imagem inválida." });
        return;
      }
      await withDb((db) =>
        db.collection<any>("assets").updateOne(
          { _id: assetId(apgId, key) },
          {
            $set: {
              apgId,
              key,
              sig: sig ?? `L${dataUrl.length}`,
              dataUrl,
              updatedAt: Date.now(),
            },
          },
          { upsert: true }
        )
      );
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
