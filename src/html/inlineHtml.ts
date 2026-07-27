// Inline formatting → HTML for the interactive material export.
//
// Mirrors the inline tag set the editor toolbar inserts (and that richText.ts
// consumes for the PDF), but emits safe HTML instead of pdfmake runs:
//
//   [b]negrito[/b]  [i]itálico[/i]  [u]sublinhado[/u]  [s]tachado[/s]
//   [c=#1B4332]cor[/c]              [h=#FFF3A0]marca-texto[/h]
//   [sz=14]tamanho pt[/sz]          [f=Montserrat]família[/f]
//
// Text is HTML-escaped FIRST, then the tags are applied, so authored content
// can never inject markup. Hard line breaks (\n) become <br>. Unlike
// richText.ts (which classifies glyphs per font for embedding), the browser
// already has full Unicode coverage, so no glyph-fallback pass is needed here.

// Same token set as richText.ts TAG_RE.
const TAG_RE =
  /(\[\/?[bius]\]|\[c=#[0-9a-fA-F]{3,8}\]|\[\/c\]|\[h=#[0-9a-fA-F]{3,8}\]|\[\/h\]|\[sz=\d{1,2}(?:\.\d)?\]|\[\/sz\]|\[f=[A-Za-z]+\]|\[\/f\])/g;

// Only these families are meaningful; anything else falls back to inherit.
const ALLOWED_FONTS: Record<string, string> = {
  Tinos: "'Tinos', Georgia, 'Times New Roman', serif",
  Montserrat: "'Montserrat', system-ui, sans-serif",
  DejaVuSerif: "'DejaVu Serif', Georgia, serif",
};

/** Escape the five HTML-significant characters. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Style {
  bold: number;
  italic: number;
  underline: number;
  strike: number;
  color: string[];
  background: string[];
  size: number[];
  font: string[];
}

/** Open <span>/tags for the current style, wrapping already-escaped text. */
function wrap(text: string, st: Style): string {
  if (!text) return "";
  const styles: string[] = [];
  if (st.color.length) styles.push(`color:${st.color[st.color.length - 1]}`);
  if (st.background.length)
    styles.push(`background:${st.background[st.background.length - 1]}`);
  if (st.size.length) styles.push(`font-size:${st.size[st.size.length - 1]}px`);
  if (st.font.length) {
    const fam = ALLOWED_FONTS[st.font[st.font.length - 1]];
    if (fam) styles.push(`font-family:${fam}`);
  }
  const decos: string[] = [];
  if (st.underline > 0) decos.push("underline");
  if (st.strike > 0) decos.push("line-through");
  if (decos.length) styles.push(`text-decoration:${decos.join(" ")}`);

  let out = text;
  if (st.bold > 0) out = `<strong>${out}</strong>`;
  if (st.italic > 0) out = `<em>${out}</em>`;
  if (styles.length) out = `<span style="${styles.join(";")}">${out}</span>`;
  return out;
}

/**
 * Convert a string with inline tags to safe HTML. The text is escaped as it is
 * emitted; only the recognized tags affect styling. Returns "" for empty input.
 */
export function inlineToHtml(raw: string): string {
  if (!raw) return "";
  const st: Style = {
    bold: 0,
    italic: 0,
    underline: 0,
    strike: 0,
    color: [],
    background: [],
    size: [],
    font: [],
  };

  const parts = raw.split(TAG_RE);
  let html = "";
  for (const part of parts) {
    if (!part) continue;
    // Is this piece a recognized tag? (split with a capturing group keeps them.)
    const isTag = /^\[\/?(?:[bius]|c|h|sz|f)(?:=[^\]]*)?\]$/.test(part);
    if (!isTag) {
      // Plain text run: escape, honor hard line breaks.
      html += wrap(escapeHtml(part).replace(/\n/g, "<br>"), st);
      continue;
    }
    const t = part.toLowerCase();
    if (t === "[b]") st.bold++;
    else if (t === "[/b]") st.bold = Math.max(0, st.bold - 1);
    else if (t === "[i]") st.italic++;
    else if (t === "[/i]") st.italic = Math.max(0, st.italic - 1);
    else if (t === "[u]") st.underline++;
    else if (t === "[/u]") st.underline = Math.max(0, st.underline - 1);
    else if (t === "[s]") st.strike++;
    else if (t === "[/s]") st.strike = Math.max(0, st.strike - 1);
    else if (t.startsWith("[c=")) st.color.push(part.slice(3, -1));
    else if (t === "[/c]") st.color.pop();
    else if (t.startsWith("[h=")) st.background.push(part.slice(3, -1));
    else if (t === "[/h]") st.background.pop();
    else if (t.startsWith("[sz=")) st.size.push(parseFloat(part.slice(4, -1)));
    else if (t === "[/sz]") st.size.pop();
    else if (t.startsWith("[f=")) st.font.push(part.slice(3, -1));
    else if (t === "[/f]") st.font.pop();
  }
  return html;
}
