// Shared-password gate for the API. Every request must send the agreed password
// in the `x-app-password` header; it's compared against APP_PASSWORD (an env var
// set in Vercel). Returns true when authorized; otherwise writes the error
// response and returns false so the handler can `if (!checkAuth(req, res)) return;`.

import type { VercelRequest, VercelResponse } from "@vercel/node";

export function checkAuth(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "APP_PASSWORD não está configurada no servidor." });
    return false;
  }
  const raw = req.headers["x-app-password"];
  const pw = Array.isArray(raw) ? raw[0] : raw;
  if (!pw || pw !== expected) {
    res.status(401).json({ error: "Senha incorreta." });
    return false;
  }
  return true;
}
