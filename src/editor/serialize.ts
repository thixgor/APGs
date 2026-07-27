// Round-trip between the visual editor's HTML and the tag-based `conteudoRaw`
// the PDF pipeline already understands.
//
//   rawToHtml(raw, images)  ->  HTML for the contentEditable surface
//   htmlToRaw(rootElement)  ->  tag text consumed by parseContent()/generatePdf
//
// The editor surface only ever contains a constrained set of nodes (we control
// every insertion and sanitize pastes), so serialization stays predictable.
// Headings carry NO numbers in the DOM — numbering is shown live via CSS
// counters and recomputed here sequentially, matching the PDF exactly.

import type { ContentBlock } from "../state/types";
import { parseContent } from "../parser/contentParser";

// Families we can actually embed in the PDF; anything else degrades to default.
const FONT_CSS: Record<string, string> = {
  Tinos: "'Tinos', 'Times New Roman', serif",
  Montserrat: "'Montserrat', system-ui, sans-serif",
  DejaVuSerif: "'DejaVu Serif', serif",
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Normalize a CSS color (rgb()/named/hex) to #rrggbb, or "" if unusable. */
function toHex(color: string): string {
  if (!color) return "";
  const c = color.trim().toLowerCase();
  if (c === "transparent" || c === "rgba(0, 0, 0, 0)") return "";
  if (c.startsWith("#")) return c;
  const m = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return "";
  const h = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

/** Parse a CSS font-size into integer points (px is converted at 0.75). */
function toPt(size: string): number | null {
  const m = size.trim().match(/^([\d.]+)(pt|px)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  return Math.round(m[2] === "px" ? n * 0.75 : n);
}

/** Map a CSS font-family value back to one of our embedded family keys. */
function familyKey(family: string): string | null {
  const f = family.toLowerCase();
  if (f.includes("montserrat")) return "Montserrat";
  if (f.includes("dejavu")) return "DejaVuSerif";
  if (f.includes("tinos") || f.includes("times")) return "Tinos";
  return null;
}

// ---------------------------------------------------------------------------
// raw -> HTML (for loading content into the editor)
// ---------------------------------------------------------------------------

/** Collapse internal whitespace (incl. line breaks) to a single space. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Convert inline tag text to safe HTML for the editor surface. */
function inlineToHtml(text: string): string {
  // Hard line breaks within a paragraph round-trip as <br>.
  let h = esc(text).replace(/\r?\n/g, "<br>");
  h = h
    .replace(/\[b\]/g, "<b>").replace(/\[\/b\]/g, "</b>")
    .replace(/\[i\]/g, "<i>").replace(/\[\/i\]/g, "</i>")
    .replace(/\[u\]/g, "<u>").replace(/\[\/u\]/g, "</u>")
    .replace(/\[s\]/g, "<s>").replace(/\[\/s\]/g, "</s>")
    .replace(/\[c=(#[0-9a-fA-F]{3,8})\]/g, '<span style="color:$1">')
    .replace(/\[\/c\]/g, "</span>")
    .replace(/\[h=(#[0-9a-fA-F]{3,8})\]/g, '<span style="background-color:$1">')
    .replace(/\[\/h\]/g, "</span>")
    .replace(/\[sz=(\d{1,2}(?:\.\d)?)\]/g, '<span style="font-size:$1pt">')
    .replace(/\[\/sz\]/g, "</span>")
    .replace(/\[f=([A-Za-z]+)\]/g, (_m, fam: string) => {
      const css = FONT_CSS[fam];
      return css ? `<span style="font-family:${css}">` : "<span>";
    })
    .replace(/\[\/f\]/g, "</span>");
  return h;
}

function attrStyle(b: { align?: string; lineHeight?: number }): string {
  const parts: string[] = [];
  if (b.align) parts.push(`text-align:${b.align}`);
  if (b.lineHeight) parts.push(`line-height:${b.lineHeight}`);
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

function blockToHtml(b: ContentBlock, images: { id: string; dataUrl: string }[]): string {
  switch (b.kind) {
    case "heading":
      // BLOCO (level 0) has no <h0>; render it as a styled paragraph carrying its
      // literal "BLOCO N …" text so it round-trips (htmlToRaw → parseContent
      // recognizes "BLOCO N" again). H1–H3 keep auto-numbering via CSS counters.
      if (b.level === 0) {
        return `<p class="ve-bloco"${attrStyle(b)}>${esc(b.number)} ${inlineToHtml(b.text)}</p>`;
      }
      return `<h${b.level}${attrStyle(b)}>${inlineToHtml(b.text) || "<br>"}</h${b.level}>`;
    case "paragraph":
      return `<p${attrStyle(b)}>${inlineToHtml(b.text) || "<br>"}</p>`;
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      const items = b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("");
      return `<${tag}${attrStyle(b)}>${items}</${tag}>`;
    }
    case "divider":
      return "<hr>";
    case "image": {
      const img = images.find((i) => i.id === b.imageId);
      const src = img ? img.dataUrl : "";
      const cap = b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : "";
      const align = b.align || "center";
      const width = b.width || "full";
      return (
        `<figure class="ve-image" contenteditable="false" ` +
        `data-img-id="${esc(b.imageId)}" data-align="${align}" data-width="${width}">` +
        (src ? `<img src="${src}" alt="${esc(b.imageId)}">` : `<div class="ve-missing">Imagem “${esc(b.imageId)}” não encontrada</div>`) +
        cap +
        `</figure>`
      );
    }
    case "table": {
      const cap = b.title ? `<caption>${inlineToHtml(b.title)}</caption>` : "";
      const head = `<tr>${b.header.map((c) => `<th>${inlineToHtml(c)}</th>`).join("")}</tr>`;
      const body = b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inlineToHtml(c)}</td>`).join("")}</tr>`)
        .join("");
      return `<table class="ve-table">${cap}${head}${body}</table>`;
    }
    default:
      return "";
  }
}

/** Build the editor HTML for a stored `conteudoRaw` value. */
export function rawToHtml(raw: string, images: { id: string; dataUrl: string }[]): string {
  const blocks = parseContent(raw);
  if (blocks.length === 0) return "<p><br></p>";
  return blocks.map((b) => blockToHtml(b, images)).join("");
}

// ---------------------------------------------------------------------------
// HTML -> raw (for saving the editor's content)
// ---------------------------------------------------------------------------

const BOLD = new Set(["B", "STRONG"]);
const ITALIC = new Set(["I", "EM"]);
const UNDER = new Set(["U", "INS"]);
const STRIKE = new Set(["S", "STRIKE", "DEL"]);

/** Serialize the inline content of a block element to tag text. */
function inlineToTags(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.textContent || "").replace(/\s+/g, " ");
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    if (el.tagName === "BR") {
      out += "\n"; // hard line break within a block
      return;
    }

    const open: string[] = [];
    const close: string[] = [];
    const wrap = (o: string, c: string) => {
      open.push(o);
      close.unshift(c);
    };

    const st = el.style;
    if (BOLD.has(el.tagName) || st.fontWeight === "bold" || Number(st.fontWeight) >= 600) wrap("[b]", "[/b]");
    if (ITALIC.has(el.tagName) || st.fontStyle === "italic") wrap("[i]", "[/i]");
    const deco = st.textDecoration || st.textDecorationLine || "";
    if (UNDER.has(el.tagName) || deco.includes("underline")) wrap("[u]", "[/u]");
    if (STRIKE.has(el.tagName) || deco.includes("line-through")) wrap("[s]", "[/s]");

    const color = toHex(st.color);
    if (color) wrap(`[c=${color}]`, "[/c]");
    const bg = toHex(st.backgroundColor);
    if (bg) wrap(`[h=${bg}]`, "[/h]");
    if (st.fontSize) {
      const pt = toPt(st.fontSize);
      if (pt) wrap(`[sz=${pt}]`, "[/sz]");
    }
    if (st.fontFamily) {
      const fam = familyKey(st.fontFamily);
      if (fam) wrap(`[f=${fam}]`, "[/f]");
    }

    out += open.join("") + inlineToTags(el) + close.join("");
  });
  // Collapse runs of empty tag pairs / redundant spaces produced by the editor.
  return out.replace(/[ \t]{2,}/g, " ");
}

/** Block-level directive prefix from a block element's style. */
function blockPrefix(el: HTMLElement): string {
  let p = "";
  const align = el.style.textAlign;
  if (align === "center") p += "[al=c]";
  else if (align === "right") p += "[al=r]";
  else if (align === "justify") p += "[al=j]";
  else if (align === "left") p += "[al=l]";
  const lh = parseFloat(el.style.lineHeight);
  if (!Number.isNaN(lh) && lh > 0) p += `[ls=${lh}]`;
  return p;
}

function cellText(el: HTMLElement): string {
  // Tables can't carry our pipe delimiter or line breaks inside a cell.
  return oneLine(inlineToTags(el).replace(/\|/g, "/"));
}

/** Serialize the editor's root element back to tag-based raw text. */
export function htmlToRaw(root: HTMLElement): string {
  const lines: string[] = [];
  // Sequential heading counters, matching the editor's CSS counters.
  let part = 0;
  let sub = 0;
  let subsub = 0;

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || "").trim();
      if (t) lines.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;

    if (tag === "H1") {
      part += 1;
      sub = 0;
      subsub = 0;
      lines.push(`${blockPrefix(el)}PARTE ${part} ${oneLine(inlineToTags(el))}`.trim());
      lines.push("");
    } else if (tag === "H2") {
      sub += 1;
      subsub = 0;
      lines.push(`${blockPrefix(el)}${part}.${sub} ${oneLine(inlineToTags(el))}`.trim());
    } else if (tag === "H3") {
      subsub += 1;
      lines.push(`${blockPrefix(el)}${part}.${sub}.${subsub} ${oneLine(inlineToTags(el))}`.trim());
    } else if (tag === "HR") {
      lines.push("[hr]");
      lines.push("");
    } else if (tag === "UL" || tag === "OL") {
      const ordered = tag === "OL";
      const prefix = blockPrefix(el);
      let n = 1;
      el.querySelectorAll(":scope > li").forEach((li) => {
        const text = oneLine(inlineToTags(li));
        if (!text) return;
        const marker = ordered ? `${n}. ` : "• ";
        lines.push(`${prefix}${marker}${text}`);
        n += 1;
      });
      lines.push("");
    } else if (tag === "FIGURE" || el.dataset.imgId) {
      const id = el.dataset.imgId || "";
      if (!id) return;
      const align = el.dataset.align && el.dataset.align !== "center" ? `[al=${el.dataset.align[0]}]` : "";
      const width = el.dataset.width && el.dataset.width !== "full" ? `[w=${el.dataset.width}]` : "";
      const figcap = el.querySelector("figcaption");
      const caption = figcap ? oneLine(inlineToTags(figcap)) : "";
      lines.push(`${align}${width}[[img:${id}${caption ? `|${caption}` : ""}]]`);
      lines.push("");
    } else if (tag === "TABLE") {
      const caption = el.querySelector(":scope > caption");
      const title = caption ? oneLine(inlineToTags(caption)) : "";
      lines.push(`[tabela]${title ? ` ${title}` : ""}`);
      el.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("th,td")).map((c) =>
          cellText(c as HTMLElement)
        );
        if (cells.some((c) => c)) lines.push(cells.join(" | "));
      });
      lines.push("[/tabela]");
      lines.push("");
    } else {
      // P, DIV or anything else -> paragraph. Internal <br> become \n (hard
      // breaks); a blank line after keeps separate paragraphs separate.
      const text = inlineToTags(el).replace(/\n[ \t]+/g, "\n").trim();
      if (text) {
        lines.push(`${blockPrefix(el)}${text}`);
        lines.push("");
      }
    }
  });

  // Collapse 3+ blank lines and trim trailing whitespace.
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
