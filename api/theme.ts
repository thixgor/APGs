// PUT /api/theme — upsert the single shared theme document (meta._id = "theme").

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  try {
    const body: any = req.body ?? {};
    const { _id, ...theme } = body;
    await (await getDb())
      .collection<any>("meta")
      .updateOne({ _id: "theme" }, { $set: theme }, { upsert: true });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
