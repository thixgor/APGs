// GET /api/state — returns the whole shared acervo: every APG + the theme.
// Also doubles as login validation: a 200 means the password was accepted.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_lib/mongo.js";
import { checkAuth } from "./_lib/auth.js";
import { docToApg, docToTheme } from "./_lib/shape.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  try {
    const db = await getDb();
    const [apgDocs, themeDoc] = await Promise.all([
      db.collection<any>("apgs").find({}).toArray(),
      db.collection<any>("meta").findOne({ _id: "theme" }),
    ]);
    res.status(200).json({
      apgs: apgDocs.map(docToApg),
      theme: docToTheme(themeDoc),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
