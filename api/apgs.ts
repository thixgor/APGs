// /api/apgs
//   PUT    — upsert one APG (body = the APG) or many (body = { apgs: APG[] }).
//   DELETE — remove one APG by id (?id=<id>).
// The APG id becomes the Mongo `_id`; `updatedAt` is stamped server-side.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  try {
    const col = (await getDb()).collection<any>("apgs");

    if (req.method === "PUT") {
      const body: any = req.body ?? {};
      const list: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body.apgs)
        ? body.apgs
        : [body];
      const now = Date.now();
      await Promise.all(
        list
          .filter((a) => a && a.id)
          .map((a) => {
            const { id, _id, ...rest } = a;
            return col.updateOne(
              { _id: id },
              { $set: { ...rest, updatedAt: now } },
              { upsert: true }
            );
          })
      );
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
      await col.deleteOne({ _id: id });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
