// Export/import of all APGs as a single portable JSON file, so a student can
// back up their work or send it to a colleague who imports it on another
// computer. The file carries everything (texts, images as data URLs, exercises)
// so it is fully self-contained.

import { APG, ThemeSettings } from "../state/types";

const MAGIC = "domineaqui.apgs";

/** Build a backup file (all APGs, or any subset) and trigger a download. */
export function exportApgsFile(apgs: APG[], theme: ThemeSettings, filename?: string): void {
  const payload = {
    app: MAGIC,
    version: 1,
    exportedAt: new Date().toISOString(),
    count: apgs.length,
    theme,
    apgs,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `DomineAqui-APGs-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** File-name-safe slug from an APG title. */
function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

/** Export a single APG to its own file. */
export function exportSingleApg(apg: APG, theme: ThemeSettings): void {
  const name = `DomineAqui-P${apg.periodo}-APG${apg.numero}${apg.titulo ? "-" + slug(apg.titulo) : ""}.json`;
  exportApgsFile([apg], theme, name);
}

export interface ParsedBackup {
  apgs: unknown[];
  theme?: ThemeSettings;
}

/** Parse a backup file's text. Accepts our wrapper {app, apgs, theme} or a bare
 *  array of APGs. Throws a friendly error on anything unusable. */
export function parseBackup(text: string): ParsedBackup {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Arquivo inválido: não é um backup DomineAqui (.json).");
  }
  const apgs = Array.isArray(data) ? data : data?.apgs;
  if (!Array.isArray(apgs)) {
    throw new Error("O arquivo não contém uma lista de APGs.");
  }
  const theme = Array.isArray(data) ? undefined : (data?.theme as ThemeSettings | undefined);
  return { apgs, theme };
}
