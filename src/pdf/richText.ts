// Rich-text engine for the PDF body.
//
// Two responsibilities:
//  1. Glyph fallback — characters the serif body font lacks (Greek μ, arrows
//     →, math ≈ ≤ ≥, etc.) are routed to the DejaVuSerif fallback font so they
//     render instead of becoming blank boxes.
//  2. Inline formatting tags the editor toolbar inserts:
//       [b]negrito[/b]  [i]itálico[/i]  [u]sublinhado[/u]  [s]tachado[/s]
//       [c=#1B4332]cor do texto[/c]     [h=#FFF3A0]marca-texto[/h]
//       [sz=14]tamanho em pt[/sz]       [f=Montserrat]família[/f]
//
// Output is a pdfmake "text" value: a string when nothing special is present,
// otherwise an array of styled runs. Runs only set `font` for fallback spans
// (or an explicit family), so normal text inherits the node's font.

const FALLBACK_FONT = "DejaVuSerif";
const EMOJI_FONT = "NotoEmoji";

// Only embedded families may be requested via [f=…]; anything else is ignored
// (it would not render in the PDF without being embedded first).
const ALLOWED_FONTS = new Set(["Tinos", "Montserrat", "DejaVuSerif"]);

// Codepoint ranges the Latin serif does not cover -> use the DejaVu fallback:
// Greek + Cyrillic, super/subscripts, letterlike, arrows..misc technical,
// enclosed alphanumerics..dingbats, supplemental arrows..misc symbols.
const SYMBOL_RE =
  /[Ͱ-ӿ⁰-₟℀-⅏←-⏿①-➿⤀-⯿]/;

// True emoji (incl. astral-plane 😀🎉❤️ from Windows/iOS keyboards) route to
// the monochrome emoji font so they render as B&W glyphs instead of tofu boxes.
// Includes emoji presentation/variation selectors, ZWJ and keycap combiners so
// they don't leave stray boxes after an emoji.
function isEmojiCp(cp: number): boolean {
  return (
    (cp >= 0x1f000 && cp <= 0x1faff) || // astral-plane emoji blocks
    (cp >= 0x2600 && cp <= 0x27bf) || // misc symbols + dingbats
    (cp >= 0x2b00 && cp <= 0x2bff) || // stars, extra arrows
    (cp >= 0x2300 && cp <= 0x23ff) || // ⌚⏰⏳ etc.
    cp === 0x303d ||
    cp === 0x3030 ||
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors (emoji presentation)
    cp === 0x200d || // zero-width joiner
    cp === 0x20e3 // combining enclosing keycap
  );
}

// Guard regex (with the u flag) mirroring isEmojiCp — used only by the fast
// path so emoji-only strings aren't returned as plain (base-font) text.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{303D}\u{3030}]/u;

// Tags handled by the inline parser.
const TAG_RE =
  /(\[\/?[bius]\]|\[c=#[0-9a-fA-F]{3,8}\]|\[\/c\]|\[h=#[0-9a-fA-F]{3,8}\]|\[\/h\]|\[sz=\d{1,2}(?:\.\d)?\]|\[\/sz\]|\[f=[A-Za-z]+\]|\[\/f\])/g;

type Decoration = "underline" | "lineThrough";

export interface Run {
  text: string;
  font?: string;
  bold?: boolean;
  italics?: boolean;
  decoration?: Decoration | Decoration[];
  color?: string;
  background?: string;
  fontSize?: number;
}

interface Style {
  bold: number;
  italics: number;
  underline: number;
  strike: number;
  color: string[];
  background: string[];
  size: number[];
  font: string[];
}

/** Font override for a single character: emoji -> NotoEmoji, symbol ->
 *  DejaVu, otherwise "" (inherit the base font). Emoji takes precedence over
 *  the symbol ranges where they overlap. */
function overrideFont(ch: string): string {
  const cp = ch.codePointAt(0) ?? 0;
  if (isEmojiCp(cp)) return EMOJI_FONT;
  if (SYMBOL_RE.test(ch)) return FALLBACK_FONT;
  return "";
}

/** Split a plain text span into runs, isolating fallback/emoji-font characters. */
function splitByFont(
  text: string,
  base: Omit<Run, "text" | "font">,
  baseFont: string | undefined
): Run[] {
  const runs: Run[] = [];
  let buf = "";
  let curOv = "";
  let have = false;

  const push = () => {
    if (!buf) return;
    const font = curOv || baseFont;
    runs.push({ text: buf, ...(font ? { font } : {}), ...base });
    buf = "";
  };

  for (const ch of text) {
    const ov = overrideFont(ch);
    if (have && ov !== curOv) push();
    curOv = ov;
    have = true;
    buf += ch;
  }
  push();
  return runs;
}

function runStyle(s: Style): Omit<Run, "text" | "font"> {
  const r: Omit<Run, "text" | "font"> = {};
  if (s.bold > 0) r.bold = true;
  if (s.italics > 0) r.italics = true;
  const dec: Decoration[] = [];
  if (s.underline > 0) dec.push("underline");
  if (s.strike > 0) dec.push("lineThrough");
  if (dec.length === 1) r.decoration = dec[0];
  else if (dec.length > 1) r.decoration = dec;
  if (s.color.length) r.color = s.color[s.color.length - 1];
  if (s.background.length) r.background = s.background[s.background.length - 1];
  if (s.size.length) r.fontSize = s.size[s.size.length - 1];
  return r;
}

/** Current explicit font family at the top of the style stack, if any. */
function currentFont(s: Style): string | undefined {
  return s.font.length ? s.font[s.font.length - 1] : undefined;
}

/**
 * Parse a string into a pdfmake text value (string or run array), applying
 * inline tags and glyph fallback.
 */
export function rich(input: string): string | Run[] {
  const text = (input ?? "").replace(/[ \t]{2,}/g, " ");
  if (!text) return "";

  // Fast path: no tags and no fallback/emoji characters -> plain string.
  if (!TAG_RE.test(text) && !SYMBOL_RE.test(text) && !EMOJI_RE.test(text)) {
    TAG_RE.lastIndex = 0;
    return text;
  }
  TAG_RE.lastIndex = 0;

  const style: Style = {
    bold: 0,
    italics: 0,
    underline: 0,
    strike: 0,
    color: [],
    background: [],
    size: [],
    font: [],
  };
  const parts = text.split(TAG_RE);
  const runs: Run[] = [];

  for (const part of parts) {
    if (!part) continue;
    switch (true) {
      case part === "[b]":
        style.bold++;
        continue;
      case part === "[/b]":
        style.bold = Math.max(0, style.bold - 1);
        continue;
      case part === "[i]":
        style.italics++;
        continue;
      case part === "[/i]":
        style.italics = Math.max(0, style.italics - 1);
        continue;
      case part === "[u]":
        style.underline++;
        continue;
      case part === "[/u]":
        style.underline = Math.max(0, style.underline - 1);
        continue;
      case part === "[s]":
        style.strike++;
        continue;
      case part === "[/s]":
        style.strike = Math.max(0, style.strike - 1);
        continue;
      case /^\[c=#[0-9a-fA-F]{3,8}\]$/.test(part):
        style.color.push(part.slice(3, -1));
        continue;
      case part === "[/c]":
        style.color.pop();
        continue;
      case /^\[h=#[0-9a-fA-F]{3,8}\]$/.test(part):
        style.background.push(part.slice(3, -1));
        continue;
      case part === "[/h]":
        style.background.pop();
        continue;
      case /^\[sz=\d{1,2}(?:\.\d)?\]$/.test(part):
        style.size.push(parseFloat(part.slice(4, -1)));
        continue;
      case part === "[/sz]":
        style.size.pop();
        continue;
      case /^\[f=[A-Za-z]+\]$/.test(part): {
        const fam = part.slice(3, -1);
        // Keep the stack balanced even when the family is not embedded.
        style.font.push(ALLOWED_FONTS.has(fam) ? fam : "");
        continue;
      }
      case part === "[/f]":
        style.font.pop();
        continue;
      default: {
        const fam = currentFont(style) || undefined;
        runs.push(...splitByFont(part, runStyle(style), fam));
      }
    }
  }

  if (runs.length === 0) return "";
  return runs;
}
