// /api/blobs — the pictures, stored one document per image.
//
//   GET    ?apg=<id>&key=<k>   → one blob: { key, rev, dataUrl }
//   GET    ?apg=<id>           → every blob of that APG, up to a size budget:
//                                { blobs: [...], next: ["<key>", …] }
//   GET    ?apg=<id>&keys=a,b  → only those keys (same budgeted shape)
//   PUT                        → upsert one: { apgId, key, rev, dataUrl }
//   DELETE ?apg=<id>&key=<k>   → remove one
//
// Keeping each picture in its own document (and its own request) is what makes
// saving reliable: no single call ever approaches Vercel's 4.5 MB body cap or
// MongoDB's 16 MB document cap, which is what used to make images vanish.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import { blobId, isInline, revOf } from "./_lib/blobs.js";

// Stay well under the platform's 4.5 MB response cap; the client asks for the
// remainder in a follow-up request.
const RESPONSE_BUDGET = 3_000_000;

function one(req: VercelRequest, name: string): string | undefined {
  const raw = req.query[name];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v || undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  try {
    const col = (await getDb()).collection<any>("blobs");

    if (req.method === "GET") {
      const apgId = one(req, "apg");
      if (!apgId) {
        res.status(400).json({ error: "apg ausente." });
        return;
      }
      const key = one(req, "key");
      if (key) {
        const doc = await col.findOne({ _id: blobId(apgId, key) });
        if (!doc) {
          res.status(404).json({ error: "Imagem não encontrada." });
          return;
        }
        res.status(200).json({ key, rev: doc.rev, dataUrl: doc.dataUrl });
        return;
      }

      const wanted = one(req, "keys")?.split(",").filter(Boolean);
      const filter: any = { apgId };
      if (wanted?.length) filter.key = { $in: wanted };

      // Pick what fits the budget from the metadata first, then read only those.
      const metas = await col
        .find(filter, { projection: { key: 1, rev: 1, bytes: 1 } })
        .toArray();
      const take: string[] = [];
      const next: string[] = [];
      let total = 0;
      for (const m of metas) {
        const size = Number(m.bytes) || 0;
        if (take.length > 0 && total + size > RESPONSE_BUDGET) next.push(m.key);
        else {
          take.push(m.key);
          total += size;
        }
      }
      const docs = take.length
        ? await col.find({ _id: { $in: take.map((k) => blobId(apgId, k)) } }).toArray()
        : [];
      res.status(200).json({
        blobs: docs.map((d) => ({ key: d.key, rev: d.rev, dataUrl: d.dataUrl })),
        next,
      });
      return;
    }

    if (req.method === "PUT") {
      const body: any = req.body ?? {};
      const { apgId, key, dataUrl } = body;
      if (!apgId || !key || !isInline(dataUrl)) {
        res.status(400).json({ error: "Blob inválido (apgId, key e dataUrl são obrigatórios)." });
        return;
      }
      const rev = typeof body.rev === "string" && body.rev ? body.rev : revOf(dataUrl);
      await col.updateOne(
        { _id: blobId(apgId, key) },
        { $set: { apgId, key, rev, dataUrl, bytes: dataUrl.length, updatedAt: Date.now() } },
        { upsert: true }
      );
      res.status(200).json({ ok: true, rev });
      return;
    }

    if (req.method === "DELETE") {
      const apgId = one(req, "apg");
      const key = one(req, "key");
      if (!apgId) {
        res.status(400).json({ error: "apg ausente." });
        return;
      }
      if (key) await col.deleteOne({ _id: blobId(apgId, key) });
      else await col.deleteMany({ apgId });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
