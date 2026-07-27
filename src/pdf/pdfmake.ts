// Configures a single pdfmake instance with our embedded fonts.
// Tinos  -> serif body (metric-compatible with Times New Roman, ABNT).
// Montserrat -> elegant sans for titles and brand elements.

import pdfMake from "pdfmake/build/pdfmake";
import { vfs } from "./fonts/vfs";

// Provide our own virtual file system (base64 TTFs); we do not load the
// default Roboto vfs at all.
(pdfMake as any).vfs = vfs;

(pdfMake as any).fonts = {
  Tinos: {
    normal: "Tinos-Regular.ttf",
    bold: "Tinos-Bold.ttf",
    italics: "Tinos-Italic.ttf",
    bolditalics: "Tinos-BoldItalic.ttf",
  },
  Montserrat: {
    normal: "Montserrat-SemiBold.ttf",
    bold: "Montserrat-Bold.ttf",
    italics: "Montserrat-SemiBold.ttf",
    bolditalics: "Montserrat-Bold.ttf",
  },
  // Glyph fallback with broad Unicode coverage (symbols, Greek, arrows, math).
  DejaVuSerif: {
    normal: "DejaVuSerif.ttf",
    bold: "DejaVuSerif-Bold.ttf",
    italics: "DejaVuSerif.ttf",
    bolditalics: "DejaVuSerif-Bold.ttf",
  },
  // Monochrome emoji fallback (Noto Emoji). PDF engines cannot embed COLOR
  // emoji fonts, so emoji render as clean black-and-white glyphs instead of
  // tofu boxes. Single weight reused for all variants.
  NotoEmoji: {
    normal: "NotoEmoji-Regular.ttf",
    bold: "NotoEmoji-Regular.ttf",
    italics: "NotoEmoji-Regular.ttf",
    bolditalics: "NotoEmoji-Regular.ttf",
  },
};

export default pdfMake;
