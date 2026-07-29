// GET /api/state — the shared acervo's index.
// Also doubles as login validation: a 200 means the password was accepted.
//
//   ?manifest=1  → { theme, apgs: [{ id, updatedAt }] }   ← what the app uses
//   (no param)   → { theme, apgs: [full APGs] }           ← legacy shape
//
// The manifest is a few hundred bytes, so the client can poll it every few
// seconds and then fetch only the APGs that actually changed. The legacy shape
// returns every APG with its images inlined; on a grown acervo that response
// blows past Vercel's ~4.5 MB function limit and fails with a 500 — it is kept
// only so a browser tab still running an older build doesn't break mid-session.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import { docToApg, docToTheme, queryOne } from "./_lib/shape.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  const manifest = queryOne(req.query.manifest) === "1";

  try {
    const payload = await withDb(async (db) => {
      const apgs = db.collection<any>("apgs");
      const [apgDocs, themeDoc] = await Promise.all([
        manifest
          ? apgs.find({}, { projection: { updatedAt: 1 } }).toArray()
          : apgs.find({}).toArray(),
        db.collection<any>("meta").findOne({ _id: "theme" }),
      ]);
      return {
        apgs: manifest
          ? apgDocs.map((d) => ({ id: d._id, updatedAt: d.updatedAt ?? 0 }))
          : apgDocs.map(docToApg),
        theme: docToTheme(themeDoc),
      };
    });
    res.status(200).json(payload);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
