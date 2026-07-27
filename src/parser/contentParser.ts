// Parser for the CONTENT (body) block.
//
// Hierarchy convention pasted by the user:
//
//   PARTE 1 Anatomia do tórax        -> level 1 (part title)
//   1.1 Parede torácica              -> level 2
//   1.1.2 Músculos intercostais      -> level 3
//   <free text>                      -> paragraph (supports inline [b]/[c]/… tags)
//   • item  /  - item                -> bullet list (consecutive lines)
//   1. item /  2) item               -> ordered list (consecutive lines)
//   [hr]                             -> horizontal divider
//   [[img:img1]]                     -> image (optional caption override)
//   [[img:img2|Figura 2 - Pulmões]]
//
// Optional block directives may PREFIX any line (emitted by the visual editor;
// hand-authored content simply omits them):
//   [al=c|l|r|j]  alignment   [ls=1.5]  line spacing   [w=small|medium|full] image width
//
// Tables — two accepted forms:
//   1. Fenced (recommended, allows a title):
//        [tabela] Eucariótica vs. Procariótica
//        Característica | Procariótica | Eucariótica
//        Núcleo | Ausente | Presente
//        [/tabela]
//   2. Auto-detected: two or more consecutive lines whose cells are separated
//      by TAB (as produced by copy/paste from a real table) or by "|".
//      The first row is treated as the header.
//
// The TOC / numbering is generated automatically by the PDF layer.

import type { BlockAlign, ContentBlock } from "../state/types";

const RE_BLOCO = /^bloco\s+(\d+)\s*[:.\-–]?\s*(.*)$/i;
const RE_PARTE = /^parte\s+(\d+)\s*[:.\-–]?\s*(.*)$/i;
const RE_LEVEL3 = /^(\d+\.\d+\.\d+)\s+(.+)$/;
const RE_LEVEL2 = /^(\d+\.\d+)\s+(.+)$/;
const RE_IMAGE = /^\[\[\s*(?:img|imagem)\s*:\s*([\w-]+)\s*(?:\|\s*([^\]]*))?\]\]$/i;
// [tabela] or [tabela:N] (N = número de colunas, habilita o modo "achatado").
const RE_TABLE_OPEN = /^\[tabela(?::(\d+))?\]\s*(.*)$/i;
const RE_TABLE_CLOSE = /^\[\/tabela\]\s*$/i;
// A markdown-style separator row like |---|:--:|
const RE_SEP_ROW = /^[\s|:.\-–—]+$/;
// Horizontal divider token.
const RE_HR = /^\[hr\]$/i;
// Leading block directive: [al=…], [ls=…], [w=…].
const RE_DIRECTIVE = /^\[(al|ls|w)=([^\]\s]+)\]/i;
// List items.
const RE_BULLET = /^[••·*-]\s+(.+)$/;
const RE_ORDERED = /^\d+[.)]\s+(.+)$/;

/** Optional per-block attributes recovered from leading directives. */
interface BlockAttrs {
  align?: BlockAlign;
  lineHeight?: number;
  width?: "small" | "medium" | "full";
}

function expandAlign(v: string): BlockAlign | undefined {
  switch (v.toLowerCase()) {
    case "c":
    case "center":
      return "center";
    case "r":
    case "right":
      return "right";
    case "j":
    case "justify":
      return "justify";
    case "l":
    case "left":
      return "left";
    default:
      return undefined;
  }
}

function expandWidth(v: string): BlockAttrs["width"] {
  switch (v.toLowerCase()) {
    case "s":
    case "small":
      return "small";
    case "m":
    case "medium":
      return "medium";
    case "f":
    case "full":
      return "full";
    default:
      return undefined;
  }
}

/** Strip and collect any leading [al=…]/[ls=…]/[w=…] directives from a line. */
function takeDirectives(line: string): { attrs: BlockAttrs; rest: string } {
  const attrs: BlockAttrs = {};
  let s = line;
  let m: RegExpMatchArray | null;
  while ((m = s.match(RE_DIRECTIVE))) {
    const key = m[1].toLowerCase();
    const val = m[2];
    if (key === "al") {
      const a = expandAlign(val);
      if (a) attrs.align = a;
    } else if (key === "ls") {
      const n = parseFloat(val);
      if (!Number.isNaN(n)) attrs.lineHeight = n;
    } else if (key === "w") {
      const w = expandWidth(val);
      if (w) attrs.width = w;
    }
    s = s.slice(m[0].length).replace(/^\s+/, "");
  }
  return { attrs, rest: s };
}

/** Recognize a list item; returns its kind and inner text, or null. */
function listItem(rest: string): { ordered: boolean; text: string } | null {
  const b = rest.match(RE_BULLET);
  if (b) return { ordered: false, text: b[1].trim() };
  const o = rest.match(RE_ORDERED);
  if (o) return { ordered: true, text: o[1].trim() };
  return null;
}

/** Does a line look like a tabular row (TAB- or pipe-delimited, ≥2 cells)? */
function isDelimRow(line: string): boolean {
  if (line.includes("\t")) return line.split(/\t+/).filter((c) => c.trim()).length >= 2;
  if (line.includes("|")) return splitCells(line).length >= 2;
  return false;
}

/** Split a row into trimmed cells (TAB preferred, then "|"). */
function splitCells(line: string): string[] {
  const raw = line.includes("\t") ? line.split(/\t+/) : line.split("|");
  const cells = raw.map((c) => c.trim());
  // Drop empty leading/trailing cells produced by "| a | b |".
  while (cells.length && cells[0] === "") cells.shift();
  while (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

/**
 * Recover the cells of a "flattened" table — text copied from a chat where all
 * delimiters (|, TAB, even spaces) were lost, e.g.
 *   "Arco aórticoDerivado definitivo principal1ºRegride (...)2º..."
 * We re-insert breaks at the transitions that mark a new cell: lower/punct →
 * Uppercase, letter/punct → digit, acronym → Capitalized word, and word →
 * leading symbol (~, ≈, →…). Needs the column count to group into rows.
 */
function splitFlattened(text: string): string[] {
  const SEP = "";
  const s = text
    .replace(/([A-ZÀ-Þ]{2,})([A-ZÀ-Þ][a-zà-ÿ])/g, `$1${SEP}$2`) // DNA|Geralmente
    .replace(/([a-zà-ÿºª°%)\].,;:µ])([A-ZÀ-Þ])/g, `$1${SEP}$2`) // ...ente|Presente
    .replace(/([a-zA-ZÀ-Þà-ÿ)\].,;:ºª°%])(\d)/g, `$1${SEP}$2`) // ...principal|1º
    .replace(/([a-zà-ÿA-ZÀ-Þ.)\]º%])([~≈≤≥±•→])/g, `$1${SEP}$2`); // ...entos|~7 nm
  return s
    .split(SEP)
    .map((c) => c.trim())
    .filter(Boolean);
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Turn the raw lines inside a [tabela] fence into rows.
 *  - delimited (| or TAB): one row per line.
 *  - cols given, single run-on line: flattened recovery, then group by cols.
 *  - cols given, one cell per line: group lines by cols.
 *  - otherwise: one cell per row (degenerate, but visible/fixable).
 */
function rowsFromFence(bodyLines: string[], cols: number | null): string[][] {
  const lines = bodyLines.filter((l) => l.trim() && !RE_SEP_ROW.test(l.trim()));
  const hasDelim = lines.some((l) => l.includes("|") || l.includes("\t"));
  if (hasDelim) return lines.map((l) => splitCells(l));

  if (cols && cols > 1) {
    const cells =
      lines.length === 1 ? splitFlattened(lines[0]) : lines.map((l) => l.trim());
    return chunk(cells, cols);
  }
  return lines.map((l) => [l.trim()]);
}

function makeTable(title: string | undefined, rows: string[][]): ContentBlock | null {
  const clean = rows.filter((r) => r.length > 0);
  if (clean.length === 0) return null;
  const cols = Math.max(...clean.map((r) => r.length));
  // Normalize every row to the same column count.
  const norm = clean.map((r) => {
    const c = [...r];
    while (c.length < cols) c.push("");
    return c;
  });
  return { kind: "table", title, header: norm[0], rows: norm.slice(1) };
}

export function parseContent(raw: string): ContentBlock[] {
  const lines = raw.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    // Consecutive non-blank lines keep their hard line breaks (\n); a blank
    // line ends the paragraph. pdfmake and the visual editor both honor \n.
    const text = paragraph.join("\n").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const { attrs, rest } = takeDirectives(trimmed);
    const hasDirective = rest !== trimmed;
    const line = rest;

    // Fenced table — supports [tabela] and [tabela:N] (N = colunas).
    const mOpen = line.match(RE_TABLE_OPEN);
    if (mOpen) {
      flushParagraph();
      const cols = mOpen[1] ? parseInt(mOpen[1], 10) : null;
      const title = mOpen[2].trim() || undefined;
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && !RE_TABLE_CLOSE.test(lines[i].trim())) {
        bodyLines.push(lines[i]);
        i++;
      }
      const tbl = makeTable(title, rowsFromFence(bodyLines, cols));
      if (tbl) blocks.push(tbl);
      continue;
    }

    // Horizontal divider.
    if (RE_HR.test(line)) {
      flushParagraph();
      blocks.push({ kind: "divider" });
      continue;
    }

    // Auto-detected delimiter table (needs ≥2 consecutive rows). Skipped when
    // the line carries directives (i.e. it came from the visual editor).
    if (!hasDirective && isDelimRow(rawLine) && !RE_IMAGE.test(line)) {
      let j = i;
      const rows: string[][] = [];
      while (j < lines.length && isDelimRow(lines[j])) {
        const l = lines[j].trim();
        if (!RE_SEP_ROW.test(l)) rows.push(splitCells(l));
        j++;
      }
      if (rows.length >= 2) {
        flushParagraph();
        const tbl = makeTable(undefined, rows);
        if (tbl) blocks.push(tbl);
        i = j - 1;
        continue;
      }
      // Only one tabular line — fall through and treat as ordinary text.
    }

    const mImg = line.match(RE_IMAGE);
    if (mImg) {
      flushParagraph();
      blocks.push({
        kind: "image",
        imageId: mImg[1],
        caption: mImg[2]?.trim() || undefined,
        ...(attrs.align ? { align: attrs.align } : {}),
        ...(attrs.width ? { width: attrs.width } : {}),
      });
      continue;
    }

    // Lists — gather consecutive items of the same kind.
    const li = listItem(line);
    if (li) {
      flushParagraph();
      const items: string[] = [li.text];
      let j = i + 1;
      while (j < lines.length) {
        const t = lines[j].trim();
        if (!t) break;
        const { rest: r } = takeDirectives(t);
        const next = listItem(r);
        if (!next || next.ordered !== li.ordered) break;
        items.push(next.text);
        j++;
      }
      blocks.push({
        kind: "list",
        ordered: li.ordered,
        items,
        ...(attrs.align ? { align: attrs.align } : {}),
        ...(attrs.lineHeight ? { lineHeight: attrs.lineHeight } : {}),
      });
      i = j - 1;
      continue;
    }

    // BLOCO — top-level divider above PARTE.
    const mBloco = line.match(RE_BLOCO);
    if (mBloco) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        level: 0,
        number: `BLOCO ${mBloco[1]}`,
        text: mBloco[2].trim(),
        ...(attrs.align ? { align: attrs.align } : {}),
      });
      continue;
    }

    const mParte = line.match(RE_PARTE);
    if (mParte) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        level: 1,
        number: `PARTE ${mParte[1]}`,
        text: mParte[2].trim(),
        ...(attrs.align ? { align: attrs.align } : {}),
      });
      continue;
    }

    const m3 = line.match(RE_LEVEL3);
    if (m3) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        level: 3,
        number: m3[1],
        text: m3[2].trim(),
        ...(attrs.align ? { align: attrs.align } : {}),
      });
      continue;
    }

    const m2 = line.match(RE_LEVEL2);
    if (m2) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        level: 2,
        number: m2[1],
        text: m2[2].trim(),
        ...(attrs.align ? { align: attrs.align } : {}),
      });
      continue;
    }

    // Plain paragraph. A directive-carrying line is its own (editor) block;
    // otherwise consecutive lines accumulate into one paragraph.
    if (hasDirective) {
      flushParagraph();
      blocks.push({
        kind: "paragraph",
        text: line,
        ...(attrs.align ? { align: attrs.align } : {}),
        ...(attrs.lineHeight ? { lineHeight: attrs.lineHeight } : {}),
      });
    } else {
      paragraph.push(line);
    }
  }

  flushParagraph();
  return blocks;
}
