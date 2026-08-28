// Core data model for the DomineAqui APG PDF generator.

/** A single numbered specific objective with its bullet items. */
export interface ObjectiveSpecific {
  /** e.g. "1", "2" — the number as authored by the user. */
  number: string;
  title: string;
  items: string[];
}

/** A general objective, each carrying its own list of specific objectives. */
export interface ObjectiveGeneral {
  /** e.g. "1", "2". */
  number: string;
  description: string;
  specifics: ObjectiveSpecific[];
}

/** Horizontal alignment a block can carry (optional). */
export type BlockAlign = "left" | "center" | "right" | "justify";

/** A block of parsed body content. */
export type ContentBlock =
  | { kind: "heading"; level: 0 | 1 | 2 | 3; number: string; text: string; align?: BlockAlign; lineHeight?: number }
  | { kind: "paragraph"; text: string; align?: BlockAlign; lineHeight?: number }
  | { kind: "list"; ordered: boolean; items: string[]; align?: BlockAlign; lineHeight?: number }
  | { kind: "divider" }
  | { kind: "image"; imageId: string; caption?: string; align?: BlockAlign; width?: "small" | "medium" | "full" }
  | { kind: "table"; title?: string; header: string[]; rows: string[][] };

/** An uploaded image.
 *
 *  `dataUrl` is the picture itself, kept in memory (and in the local IndexedDB
 *  cache) so the PDF/HTML pipelines can embed it. It is NOT what travels to the
 *  server with the APG: the picture is stored as its own document and this
 *  object carries only `rev`, the content revision that points at it. An image
 *  whose `dataUrl` is empty simply has not been downloaded yet. */
export interface APGImage {
  id: string; // e.g. "img1"
  dataUrl: string; // "data:image/png;base64,..." ("" until loaded)
  /** Default caption; can be overridden inline in the content token. */
  caption?: string;
  /** Natural pixel dimensions, used to keep aspect ratio in the PDF. */
  width: number;
  height: number;
  /** Content revision of `dataUrl` (see state/blobs.ts). */
  rev?: string;
}

/** Kind of an exercise: multiple-choice (objetiva) or open/essay (discursiva). */
export type ExerciseKind = "objetiva" | "discursiva";

/** A single exercise in an APG's exercise list. Fully modular: objective
 *  questions carry options + a correct index; discursive ones carry a model
 *  answer. Both can carry an optional image (uploaded or by URL) and a
 *  commented explanation. */
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  /** The question statement (supports inline [b]/[c]/… tags). */
  statement: string;
  /** Option texts (objetiva only). Letters A, B, C… are positional. */
  options: string[];
  /** Index of the correct option (objetiva); -1 when unset. */
  correct: number;
  /** Expected/model answer (discursiva). */
  answer: string;
  /** Resposta comentada — shown in the answer key (both kinds). */
  explanation: string;
  /** Resolved data URL the PDF embeds (from upload or a fetched URL).
   *  Like APGImage.dataUrl it is stored apart from the APG document. */
  imageDataUrl?: string;
  /** Content revision of `imageDataUrl` (see state/blobs.ts). */
  imageRev?: string;
  /** Original URL, kept for markdown round-trip. */
  imageUrl?: string;
  imageCaption?: string;
}

/** One APG (Aprendizagem Baseada em Pequenos Grupos) unit. */
export interface APG {
  id: string;
  periodo: number;
  numero: number;
  titulo: string;
  /** Raw pasted text — kept so the user can re-edit; parsed on demand. */
  objetivosRaw: string;
  conteudoRaw: string;
  images: APGImage[];
  /** Optional list of exercises with answer key. */
  exercises: Exercise[];
}

/** Visual customization the user can tweak in the editor. */
export interface ThemeSettings {
  // Colors
  primary: string; // dark green brand
  primaryDark: string; // deepest green (covers)
  accent: string; // lighter green / highlight
  text: string; // body text color
  // Font sizes (pt)
  titleSize: number; // part / H1
  subtitleSize: number; // H2 / H3
  bodySize: number; // paragraph
}

export const DEFAULT_THEME: ThemeSettings = {
  primary: "#1B4332",
  primaryDark: "#0B2B20",
  accent: "#2D6A4F",
  text: "#1A1A1A",
  titleSize: 18,
  subtitleSize: 13,
  bodySize: 12,
};

/** Brand constants. */
export const BRAND = {
  name: "DomineAqui",
  site: "www.domineaqui.com.br",
  year: 2026,
  area: "Medicina",
  notice:
    "© DomineAqui 2026 — www.domineaqui.com.br · Material autoral. Proibida a reprodução, revenda ou redistribuição sem autorização.",
};
