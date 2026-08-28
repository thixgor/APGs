// GET /api/state — the whole shared acervo: every APG (metadata only) + theme.
// Also doubles as login validation: a 200 means the password was accepted.
//
// The response deliberately does NOT carry the pictures. They are fetched per
// APG from /api/blobs, which keeps this call small and fast no matter how big
// the acervo grows — the old "everything inline" response quietly blew past
// Vercel's 4.5 MB body cap and took the whole acervo down with it.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import { docToApg, docToTheme } from "./_lib/shape.js";
import { MIGRATE_BUDGET, SPLIT_FLAG, splitDoc } from "./_lib/migrate.js";

// Never send the pictures in this response.
const SLIM = { projection: { "images.dataUrl": 0, "exercises.imageDataUrl": 0 } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  try {
    const db = await getDb();
    const apgCol = db.collection<any>("apgs");
    const blobCol = db.collection<any>("blobs");
    const metaCol = db.collection<any>("meta");

    // Convert a few legacy documents per request (see _lib/migrate.ts). Best
    // effort: a failure here must never keep the acervo from loading.
    let pendingMigration = 0;
    try {
      const legacy = await apgCol
        .find({ [SPLIT_FLAG]: { $ne: true } })
        .limit(MIGRATE_BUDGET)
        .toArray();
      for (const doc of legacy) await splitDoc(apgCol, blobCol, doc);
      if (legacy.length === MIGRATE_BUDGET) {
        pendingMigration = await apgCol.countDocuments({ [SPLIT_FLAG]: { $ne: true } });
      }
    } catch {
      /* keep serving the acervo even if a conversion failed */
    }

    const [apgDocs, themeDoc] = await Promise.all([
      apgCol.find({}, SLIM).toArray(),
      metaCol.findOne({ _id: "theme" as any }),
    ]);

    res.status(200).json({
      apgs: apgDocs.map(docToApg),
      theme: docToTheme(themeDoc),
      pendingMigration,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
