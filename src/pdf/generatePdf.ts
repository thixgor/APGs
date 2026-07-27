// PDF generator for DomineAqui — builds a single consolidated academic
// document from a list of APGs using pdfmake.
//
// Document order (per spec):
//   1. General DomineAqui cover
//   2. Global summary (TOC of every APG, clickable, with page numbers)
//   3. For each APG, in sequence:
//        a. APG cover (title in evidence)
//        b. Objectives page (parsed General + Specific objectives)
//        c. APG summary (per-APG TOC)
//        d. Body content (auto-numbered topics + framed images)
//
// pdfmake gives us, natively: multiple named TOCs (`tocItem` -> `toc.id`)
// with real, clickable page numbers; smart page breaks (`unbreakable`,
// `pageBreak`); a running footer with the anti-piracy notice + page number;
// and embedded serif/sans fonts with full Portuguese glyph coverage.

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "./pdfmake";
import { parseObjectives } from "../parser/objectivesParser";
import { parseContent } from "../parser/contentParser";
import { letterFor } from "../parser/exerciseParser";
import { rich } from "./richText";
import { LOGO_DATAURL, LOGO_W, LOGO_H } from "./assets/logo";
import { QR_CODES } from "./assets/qr";
import { optimizeApgs, ExportMode } from "../utils/optimize";
import { impose2up } from "../utils/impose";
import { APG, BRAND, ContentBlock, Exercise, ThemeSettings } from "../state/types";

/** rich() that always yields an array, for composing inside text arrays. */
function inline(text: string): any[] {
  const r = rich(text);
  return Array.isArray(r) ? r : [{ text: r }];
}

// A4 page geometry in PostScript points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
// ABNT-style margins: left 3cm, right 2cm, top 3cm, bottom for footer.
const M_LEFT = 85;
const M_RIGHT = 56.7;
const M_TOP = 85;
const M_BOTTOM = 70;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;
// Height of the white strip left below cover panels so the footer stays legible.
const COVER_PANEL_H = PAGE_H - 72;

type Node = any; // pdfmake content nodes — kept loose to allow tocItem/etc.

/** A page-centered, absolutely-positioned line of text for cover layouts.
 *  pdfmake clamps an absolutely-positioned block's usable width by the right
 *  page margin, so a box at x:0/width:PAGE_W ends up centered within
 *  (PAGE_W − M_RIGHT) — visibly shifted left. Using a symmetric box
 *  [M_RIGHT, PAGE_W − M_RIGHT] makes the centering land on the true page center. */
function coverText(text: string, y: number, opts: Node = {}): Node {
  return {
    text,
    absolutePosition: { x: M_RIGHT, y },
    width: PAGE_W - 2 * M_RIGHT,
    alignment: "center",
    ...opts,
  };
}

// Doc-level named images so the logo/QR embed ONCE and are referenced wherever
// needed (footer on every page, covers, ads) — avoids per-page re-embed bloat.
const LOGO_NAME = "brandLogo";

// DomineAqui products advertised through the PDF. Each carries its own QR (by
// slug, keyed into QR_CODES) plus copy, a CTA and the URL to display.
export interface AdProduct {
  slug: string;
  kicker: string;
  headline: string;
  body: string;
  cta: string;
  ctaUrl: string;
  displayUrl: string; // shown text, without the scheme
}

export const AD_PRODUCTS: AdProduct[] = [
  {
    slug: "manual",
    kicker: "MANUAL CLÍNICO",
    headline: "Dominou a APG? Agora domine a clínica.",
    body: "Centenas de patologias com aprofundamento fisiopatológico, imagens, diagnósticos diferenciais, semiologia e clínica — e farmacologia com os mecanismos de ação destrinchados. Da teoria à beira do leito, sem lacunas.",
    cta: "Acessar o Manual Clínico",
    ctaUrl: "https://domineaqui.com.br/ldpg-mnclinico",
    displayUrl: "domineaqui.com.br/manual-clinico",
  },
  {
    slug: "flashcards",
    kicker: "FLASHCARDS",
    headline: "Fixe de vez com repetição espaçada.",
    body: "Flashcards inteligentes com repetição espaçada e respostas comentadas e aprofundadas: você revisa no momento certo e não esquece mais o que estudou.",
    cta: "Ver os Flashcards",
    ctaUrl: "https://domineaqui.com.br/flashcards",
    displayUrl: "domineaqui.com.br/flashcards",
  },
  {
    slug: "questoes",
    kicker: "BANCO DE QUESTÕES",
    headline: "Treine com as questões das suas provas.",
    body: "Monte listas personalizadas e filtre por dificuldade, tópico, subtópico, período e matéria (SOI, HAM, IESC, MCM). Estude exatamente o que cai na sua faculdade.",
    cta: "Acessar o Banco de Questões",
    ctaUrl: "https://domineaqui.com.br/banco-questoes",
    displayUrl: "domineaqui.com.br/banco-questoes",
  },
  {
    slug: "cronogramas",
    kicker: "CRONOGRAMAS",
    headline: "Organize seus estudos sem se perder.",
    body: "Toda a ementa do curso está na plataforma. Saiba exatamente o que tem no período e monte cronogramas conforme o seu tempo, suas dificuldades, as matérias e o período em que você está.",
    cta: "Montar meu Cronograma",
    ctaUrl: "https://domineaqui.com.br/cronogramas",
    displayUrl: "domineaqui.com.br/cronogramas",
  },
  {
    slug: "provas",
    kicker: "PROVAS",
    headline: "Faça as provas da sua faculdade.",
    body: "Diversas provas anexadas para você resolver e imprimir, com respostas comentadas, aprofundadas e melhoradas.",
    cta: "Fazer as Provas",
    ctaUrl: "https://domineaqui.com.br/provas",
    displayUrl: "domineaqui.com.br/provas",
  },
  {
    slug: "materiais",
    kicker: "MARKETPLACE",
    headline: "Tudo num só lugar.",
    body: "Resumos para as principais provas (por período), vídeo-aulas individuais, flashcards e muito mais. Entre no marketplace e escolha o material certo para o seu momento.",
    cta: "Ver os Materiais",
    ctaUrl: "https://domineaqui.com.br/materiais",
    displayUrl: "domineaqui.com.br/materiais",
  },
];

const qrName = (slug: string) => `qr_${slug}`;

/** A page-centered image placed at an absolute Y (used for cover logos). */
function centeredImage(width: number, y: number): Node {
  return {
    image: LOGO_NAME,
    width,
    absolutePosition: { x: (PAGE_W - width) / 2, y },
  };
}

/** The full-bleed dark-green panel that backs every cover. */
function coverPanel(theme: ThemeSettings): Node {
  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: PAGE_W, h: COVER_PANEL_H, color: theme.primaryDark },
      // Thin accent baseline of the panel.
      { type: "rect", x: 0, y: COVER_PANEL_H - 6, w: PAGE_W, h: 6, color: theme.accent },
    ],
    absolutePosition: { x: 0, y: 0 },
  };
}

/** A short centered accent rule (decorative divider) at a given y. */
function accentRule(theme: ThemeSettings, y: number, w = 110): Node {
  return {
    canvas: [{ type: "rect", x: (PAGE_W - w) / 2, y: 0, w, h: 3, color: theme.accent }],
    absolutePosition: { x: 0, y },
  };
}

function pageBreakAfter(): Node {
  return { text: "", pageBreak: "after" };
}

// ---------------------------------------------------------------------------
// Covers
// ---------------------------------------------------------------------------

function generalCover(theme: ThemeSettings, periodos: number[]): Node[] {
  const light = "#E9F3EE";
  const muted = "#A9C7B9";
  const periodLabel =
    periodos.length === 1
      ? `Período ${periodos[0]}`
      : `Períodos ${periodos.join(" · ")}`;

  return [
    coverPanel(theme),
    // Brand medallion: a light disc behind the logo so the green logo reads on
    // the dark panel.
    {
      canvas: [{ type: "ellipse", x: PAGE_W / 2, y: 120, r1: 58, r2: 58, color: light }],
      absolutePosition: { x: 0, y: 0 },
    },
    centeredImage(86, 120 - (86 * LOGO_H) / LOGO_W / 2),
    accentRule(theme, 196),
    coverText(BRAND.name, 222, {
      font: "Montserrat",
      bold: true,
      fontSize: 46,
      color: light,
      characterSpacing: 1,
    }),
    coverText("Material Acadêmico de APGs", 292, {
      font: "Montserrat",
      fontSize: 13,
      color: muted,
      characterSpacing: 3,
    }),
    accentRule(theme, 330, 60),
    coverText(BRAND.area.toUpperCase(), 420, {
      font: "Montserrat",
      bold: true,
      fontSize: 30,
      color: light,
      characterSpacing: 6,
    }),
    coverText("Caderno Consolidado de Aprendizagem Baseada em Pequenos Grupos", 470, {
      font: "Tinos",
      italics: true,
      fontSize: 13,
      color: muted,
    }),
    coverText(periodLabel, 560, {
      font: "Montserrat",
      fontSize: 12,
      color: light,
      characterSpacing: 2,
    }),
    coverText(String(BRAND.year), 690, {
      font: "Montserrat",
      bold: true,
      fontSize: 16,
      color: light,
    }),
    coverText(BRAND.site, 716, {
      font: "Montserrat",
      fontSize: 9,
      color: muted,
      characterSpacing: 1,
    }),
    pageBreakAfter(),
  ];
}

// ---------------------------------------------------------------------------
// Preface (front matter: storytelling + legal / copyright)
// ---------------------------------------------------------------------------

function prefaceSection(theme: ThemeSettings): Node[] {
  const linkColor = "#1565a8";
  const link = (label: string, url: string): Node => ({
    text: label,
    link: url,
    color: linkColor,
    decoration: "underline",
  });
  // Compact paragraph so the whole preface fits ONE page (no orphaned signature
  // / blank pages). No trailing pageBreakAfter — the showcase starts the next
  // page itself (pageBreak:"before"), which also avoids phantom blank pages
  // that previously threw off the per-APG running-header page numbers.
  const para = (text: any, margin: number[] = [0, 0, 0, 4]): Node => ({
    text,
    font: "Tinos",
    fontSize: 10,
    lineHeight: 1.22,
    alignment: "justify",
    margin,
  });

  return [
    { text: "Prefácio", style: "sectionTitle", margin: [0, 0, 0, 2] },
    {
      text: `${BRAND.name} — Material Acadêmico de APGs`,
      font: "Tinos",
      italics: true,
      fontSize: 10.5,
      color: theme.accent,
      margin: [0, 0, 0, 8],
    },

    // Storytelling
    para(
      "Eu sempre quis estudar para as APGs de forma aprofundada e sem lacunas. Mas os resumos e materiais que encontrava na internet eram básicos, superficiais e desleixados — além de não serem específicos para o que realmente é cobrado."
    ),
    para(
      "Foi por isso que criamos o DomineAqui. Aqui, abrimos cada objetivo de APG em objetivos específicos, para que você saiba exatamente o que estudar — com base no que importa para as provas e para a Medicina como um todo."
    ),
    para(
      "Este material foi construído para ser completo e sem lacunas: cada tópico é desenvolvido com profundidade, organização e foco no essencial, para que o seu tempo de estudo renda de verdade."
    ),
    para([{ text: "Criadores: ", bold: true }, "Thiago Rodrigues e João Henrique Lemos."], [0, 3, 0, 8]),

    // Legal / copyright
    {
      text: "Aviso Legal e Direitos Autorais",
      font: "Montserrat",
      bold: true,
      fontSize: 11.5,
      color: theme.primary,
      margin: [0, 2, 0, 4],
    },
    para([
      "Nos termos da ",
      { text: "Lei nº 9.610/1998", bold: true },
      " (Lei de Direitos Autorais), o download deste material é liberado ",
      { text: "somente para uso individual do titular da conta", bold: true },
      ".",
    ]),
    para(
      "Este material é protegido por copyright e direitos autorais. A distribuição, o compartilhamento, a revenda, a publicação, a disponibilização em grupos ou plataformas e qualquer repasse a terceiros não são autorizados."
    ),
    {
      stack: [
        { text: ["Termos de Serviço: ", link("domineaqui.com.br/termos-de-servico", "https://domineaqui.com.br/termos-de-servico")] },
        { text: ["Política de Privacidade: ", link("domineaqui.com.br/politica-de-privacidade", "https://domineaqui.com.br/politica-de-privacidade")], margin: [0, 2, 0, 0] },
        {
          text: [
            "Termos de Copyright (documento): ",
            link("acessar arquivo", "https://drive.google.com/file/d/1YjgRZZV_cQQkLdD7SrNGbCdSrzn13sKo/view?usp=sharing"),
          ],
          margin: [0, 2, 0, 0],
        },
      ],
      font: "Tinos",
      fontSize: 10,
      color: theme.text,
      lineHeight: 1.25,
      margin: [0, 3, 0, 8],
    },

    // Digital signature line. A thin top border via a table is used as the
    // separator — a canvas line in the content flow was triggering a spurious
    // page break that pushed the signature onto a blank page.
    {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "Documento assinado digitalmente em 16/05/2026 às 15:43:51 -0300 via gov.br.",
              font: "Montserrat",
              fontSize: 8.5,
              italics: true,
              color: "#5a6b62",
              alignment: "left",
              border: [false, true, false, false],
              margin: [0, 6, 0, 0],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        hLineColor: () => "#cdd9d2",
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      margin: [0, 8, 0, 0],
    },
  ];
}

function apgCover(apg: APG, theme: ThemeSettings): Node[] {
  const light = "#E9F3EE";
  const muted = "#A9C7B9";
  return [
    coverPanel(theme),
    // Brand medallion at the top of the APG cover.
    {
      canvas: [{ type: "ellipse", x: PAGE_W / 2, y: 120, r1: 46, r2: 46, color: light }],
      absolutePosition: { x: 0, y: 0 },
    },
    centeredImage(68, 120 - (68 * LOGO_H) / LOGO_W / 2),
    // Invisible anchor that feeds the GLOBAL summary entry + its page number.
    {
      text: `APG ${apg.numero} — ${apg.titulo || "Sem título"}`,
      tocItem: "mainToc",
      tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
      tocMargin: [0, 6, 0, 0],
      fontSize: 1,
      color: theme.primaryDark, // blends into the panel — purely an anchor
      absolutePosition: { x: 0, y: 4 },
    },
    coverText(`PERÍODO ${apg.periodo}`, 250, {
      font: "Montserrat",
      fontSize: 12,
      color: muted,
      characterSpacing: 4,
    }),
    coverText(`APG ${apg.numero}`, 300, {
      font: "Montserrat",
      bold: true,
      fontSize: 54,
      color: light,
    }),
    accentRule(theme, 392, 90),
    coverText(apg.titulo || "Sem título", 430, {
      font: "Tinos",
      bold: true,
      fontSize: 24,
      color: light,
      width: PAGE_W - 120,
      // recentre the narrower text box
      absolutePosition: { x: 60, y: 430 },
    }),
    coverText(BRAND.name, 700, {
      font: "Montserrat",
      bold: true,
      fontSize: 12,
      color: muted,
      characterSpacing: 2,
    }),
    pageBreakAfter(),
  ];
}

// ---------------------------------------------------------------------------
// Objectives page
// ---------------------------------------------------------------------------

function objectivesSection(apg: APG, theme: ThemeSettings): Node[] {
  const generals = parseObjectives(apg.objetivosRaw);
  const out: Node[] = [
    {
      text: "Objetivos de Aprendizagem",
      style: "sectionTitle",
      margin: [0, 0, 0, 4],
      // Running-header marker for this APG (captured in pageBreakBefore).
      id: `apghdr|${apg.numero}|${apg.periodo}|${encodeURIComponent(apg.titulo || "")}`,
    },
    {
      text: `APG ${apg.numero} — ${apg.titulo}`,
      font: "Tinos",
      italics: true,
      fontSize: 11,
      color: theme.accent,
      margin: [0, 0, 0, 16],
    },
  ];

  if (generals.length === 0) {
    out.push({
      text: "Nenhum objetivo cadastrado. Cole o bloco de objetivos no editor.",
      italics: true,
      color: "#8a8a8a",
    });
  }

  generals.forEach((g) => {
    out.push({
      text: `Objetivo Geral ${g.number}`,
      font: "Montserrat",
      bold: true,
      fontSize: 13,
      color: theme.primary,
      margin: [0, 12, 0, 4],
    });
    if (g.description) {
      out.push({ text: rich(g.description), alignment: "justify", margin: [0, 0, 0, 6] });
    }
    if (g.specifics.length) {
      out.push({
        text: "Objetivos Específicos",
        font: "Montserrat",
        bold: true,
        fontSize: 11,
        color: theme.accent,
        margin: [0, 6, 0, 6],
      });
    }
    g.specifics.forEach((s) => {
      out.push({
        text: [{ text: `${s.number}. `, color: theme.primary }, ...inline(s.title)],
        font: "Tinos",
        bold: true,
        fontSize: 12,
        alignment: "left",
        margin: [0, 6, 0, 2],
      });
      if (s.items.length) {
        out.push({
          ul: s.items.map((it) => ({ text: rich(it) })),
          margin: [12, 0, 0, 4],
          alignment: "justify",
          lineHeight: 1.4,
        });
      }
    });
  });

  out.push(pageBreakAfter());
  return out;
}

// ---------------------------------------------------------------------------
// Objectives-only outline (study-summary export)
// ---------------------------------------------------------------------------

/** A compact per-APG block for the "Resumo de Objetivos" export: the APG's
 *  learning objectives and, optionally, the list of content topics ("temas").
 *  Packed (no forced page break per APG) so the summary stays short. */
function objectivesOutlineSection(
  apg: APG,
  theme: ThemeSettings,
  includeTemas: boolean
): Node[] {
  const out: Node[] = [];

  // APG heading — doubles as the label since this export has no running header.
  // It's also the Sumário entry (tocItem) so the front TOC lists this APG and
  // the page where its objectives start.
  out.push({
    text: `APG ${apg.numero} — ${apg.titulo || "Sem título"}`,
    font: "Montserrat",
    bold: true,
    fontSize: 13,
    color: theme.primary,
    margin: [0, 10, 0, 2],
    tocItem: "objToc",
    tocStyle: { font: "Tinos", fontSize: 11, color: theme.text },
    tocMargin: [0, 2, 0, 0],
  });
  out.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 1.5, color: theme.accent }],
    margin: [0, 0, 0, 6],
  });

  // Objectives.
  const generals = parseObjectives(apg.objetivosRaw);
  if (generals.length === 0) {
    out.push({
      text: "Nenhum objetivo cadastrado.",
      italics: true,
      color: "#8a8a8a",
      margin: [0, 0, 0, 4],
    });
  }
  generals.forEach((g) => {
    out.push({
      text: `Objetivo Geral ${g.number}`,
      font: "Montserrat",
      bold: true,
      fontSize: 11,
      color: theme.primary,
      margin: [0, 6, 0, 2],
    });
    if (g.description) {
      out.push({ text: rich(g.description), alignment: "justify", margin: [0, 0, 0, 4] });
    }
    g.specifics.forEach((s) => {
      out.push({
        text: [{ text: `${s.number}. `, color: theme.primary }, ...inline(s.title)],
        font: "Tinos",
        bold: true,
        fontSize: 11,
        alignment: "left",
        margin: [6, 4, 0, 1],
      });
      if (s.items.length) {
        out.push({
          ul: s.items.map((it) => ({ text: rich(it) })),
          margin: [16, 0, 0, 2],
          alignment: "justify",
          lineHeight: 1.3,
        });
      }
    });
  });

  // Optional "Temas abordados" — the content section headings (topic tree).
  if (includeTemas) {
    const headings = parseContent(apg.conteudoRaw).filter(
      (b): b is Extract<ContentBlock, { kind: "heading" }> => b.kind === "heading"
    );
    out.push({
      text: "Temas abordados",
      font: "Montserrat",
      bold: true,
      fontSize: 11,
      color: theme.accent,
      margin: [0, 8, 0, 3],
    });
    if (headings.length === 0) {
      out.push({
        text: "Sem temas cadastrados no conteúdo.",
        italics: true,
        color: "#8a8a8a",
        fontSize: 10,
        margin: [6, 0, 0, 2],
      });
    } else {
      headings.forEach((h) => {
        out.push({
          text: [
            h.number ? { text: `${h.number} `, color: theme.primary, bold: true } : "",
            { text: h.text },
          ],
          font: "Tinos",
          fontSize: h.level === 0 ? 11 : 10,
          bold: h.level <= 1,
          color: h.level === 0 ? theme.primary : theme.text,
          margin: [6 + h.level * 14, h.level <= 1 ? 3 : 1, 0, 1],
        });
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Per-APG summary (TOC)
// ---------------------------------------------------------------------------

function apgToc(apg: APG): Node[] {
  return [
    {
      toc: {
        id: `apg_${apg.id}`,
        title: { text: "Sumário", style: "tocTitle" },
      },
    },
    pageBreakAfter(),
  ];
}

// ---------------------------------------------------------------------------
// Body content
// ---------------------------------------------------------------------------

function framedImage(
  dataUrl: string,
  fig: number,
  caption: string | undefined,
  align: "left" | "center" | "right" = "center",
  width: "small" | "medium" | "full" = "full"
): Node {
  // Frame width as a fraction of the text column, by preset.
  const frac = width === "small" ? 0.45 : width === "medium" ? 0.7 : 1;
  const frameW = CONTENT_W * frac;
  // The image fits inside the frame minus its padding (9pt each side).
  const fit: [number, number] = [frameW - 18, 480];

  const frame: Node = {
    table: {
      widths: [frameW],
      body: [[{ image: dataUrl, fit, alignment: "center" }]],
    },
    layout: {
      hLineWidth: () => 0.75,
      vLineWidth: () => 0.75,
      hLineColor: () => "#cdd8d2",
      vLineColor: () => "#cdd8d2",
      paddingLeft: () => 9,
      paddingRight: () => 9,
      paddingTop: () => 9,
      paddingBottom: () => 9,
      fillColor: () => "#fbfdfc",
    },
    alignment: align,
  };

  return {
    unbreakable: true,
    margin: [0, 12, 0, 16],
    stack: [
      frame,
      {
        text: caption ? [{ text: `Figura ${fig} — ` }, ...inline(caption)] : `Figura ${fig}`,
        style: "caption",
        alignment: align,
      },
    ],
  };
}

function renderTable(
  b: { title?: string; header: string[]; rows: string[][] },
  theme: ThemeSettings
): Node {
  const fs = Math.max(8, theme.bodySize - 1.5);
  const headerCells = b.header.map((h) => ({
    text: rich(h),
    fillColor: theme.primary,
    color: "#ffffff",
    bold: true,
    font: "Montserrat",
    fontSize: fs,
    margin: [5, 5, 5, 5],
    alignment: "left",
  }));
  const bodyRows = b.rows.map((row, ri) =>
    row.map((cell) => ({
      text: rich(cell),
      fillColor: ri % 2 === 0 ? "#ffffff" : "#f1f7f3",
      font: "Tinos",
      fontSize: fs,
      color: theme.text,
      lineHeight: 1.25,
      alignment: "left",
      margin: [5, 4, 5, 4],
    }))
  );
  const widths = b.header.map(() => "*");

  const stack: Node[] = [];
  if (b.title) {
    stack.push({
      text: rich(b.title),
      font: "Montserrat",
      bold: true,
      fontSize: Math.max(9, theme.bodySize - 1),
      color: theme.primary,
      alignment: "center",
      margin: [0, 0, 0, 6],
    });
  }
  stack.push({
    table: { headerRows: 1, widths, body: [headerCells, ...bodyRows] },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === 1 || i === node.table.body.length ? 0.9 : 0.5,
      vLineWidth: () => 0.5,
      hLineColor: (i: number) => (i === 1 ? theme.primary : "#cdd9d2"),
      vLineColor: () => "#cdd9d2",
    },
  });

  return { stack, margin: [0, 10, 0, 14] };
}

function contentSection(apg: APG, theme: ThemeSettings): Node[] {
  const blocks = parseContent(apg.conteudoRaw);
  const out: Node[] = [];
  let figureCount = 0;
  let firstNode = true;
  let sawHeading = false;
  let prevWasBloco = false; // suppress the page break of a PARTE right after a BLOCO

  // Optional per-block overrides (alignment / line spacing) emitted by the
  // visual editor; absent on hand-pasted content, which keeps its defaults.
  const withAttrs = (node: Node, b: { align?: string; lineHeight?: number }): Node => {
    if (b.align) node.alignment = b.align;
    if (b.lineHeight) node.lineHeight = b.lineHeight;
    return node;
  };

  for (const b of blocks) {
    if (b.kind === "heading") {
      if (b.level === 0) {
        // BLOCO — top-level section divider above PARTE; biggest heading, starts
        // a fresh page. The PARTE that follows stays on the same page (banner).
        out.push(
          withAttrs(
            {
              text: [
                { text: `${b.number}`, color: theme.primary },
                ...(b.text ? [{ text: "  " }, ...inline(b.text)] : []),
              ],
              style: "h0",
              tocItem: `apg_${apg.id}`,
              tocStyle: { font: "Montserrat", bold: true, fontSize: 12, color: theme.primary },
              tocMargin: [0, 8, 0, 0],
              pageBreak: firstNode ? undefined : "before",
            },
            b
          )
        );
        // Thicker primary rule under the BLOCO title.
        out.push({
          canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 3, color: theme.primary }],
          margin: [0, 3, 0, 12],
        });
        sawHeading = true;
      } else if (b.level === 1) {
        // Each PART begins on a fresh page (but never as a leading blank page,
        // and not when it directly follows a BLOCO banner).
        out.push(
          withAttrs(
            {
              text: [
                { text: `${b.number}`, color: theme.accent },
                ...(b.text ? [{ text: "  " }, ...inline(b.text)] : []),
              ],
              style: "h1",
              tocItem: `apg_${apg.id}`,
              tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
              tocMargin: [0, 6, 0, 0],
              pageBreak: firstNode || prevWasBloco ? undefined : "before",
            },
            b
          )
        );
        // Accent underline beneath the part title.
        out.push({
          canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
          margin: [0, 2, 0, 10],
        });
        sawHeading = true;
      } else if (b.level === 2) {
        out.push(
          withAttrs(
            {
              text: [{ text: `${b.number} `, color: theme.primary }, ...inline(b.text)],
              bold: true,
              style: "h2",
              tocItem: `apg_${apg.id}`,
              tocStyle: { fontSize: 10, color: theme.text },
              tocMargin: [16, 2, 0, 0],
            },
            b
          )
        );
        sawHeading = true;
      } else {
        out.push(
          withAttrs(
            {
              text: [{ text: `${b.number} `, bold: true, color: theme.accent }, ...inline(b.text)],
              style: "h3",
              tocItem: `apg_${apg.id}`,
              tocStyle: { fontSize: 9, color: "#444444" },
              tocMargin: [30, 1, 0, 0],
            },
            b
          )
        );
        sawHeading = true;
      }
    } else if (b.kind === "paragraph") {
      out.push(withAttrs({ text: rich(b.text), style: "paragraph" }, b));
    } else if (b.kind === "list") {
      const items = b.items.map((it) => ({ text: rich(it) }));
      const node: Node = b.ordered ? { ol: items } : { ul: items };
      node.style = "paragraph";
      node.margin = [12, 0, 0, 8];
      out.push(withAttrs(node, b));
      sawHeading = true;
    } else if (b.kind === "divider") {
      out.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.75, lineColor: "#cdd9d2" }],
        margin: [0, 8, 0, 12],
      });
      sawHeading = true;
    } else if (b.kind === "table") {
      out.push(renderTable(b, theme));
      sawHeading = true; // ensure non-empty content isn't flagged as empty
    } else if (b.kind === "image") {
      figureCount += 1;
      const img = apg.images.find((i) => i.id === b.imageId);
      if (img && img.dataUrl && img.dataUrl.startsWith("data:")) {
        const align = b.align === "right" || b.align === "left" ? b.align : "center";
        out.push(framedImage(img.dataUrl, figureCount, b.caption ?? img.caption, align, b.width));
        sawHeading = true;
      } else if (img) {
        // Image entry exists but its data was stripped (recovered from the
        // text-only backup after an IndexedDB loss). Don't crash the PDF —
        // show a placeholder so the student knows to re-upload it.
        out.push({
          text: `[Imagem "${b.imageId}" precisa ser reenviada — recuperada sem o arquivo]`,
          italics: true,
          color: "#b45309",
          margin: [0, 4, 0, 4],
        });
        sawHeading = true;
      } else {
        out.push({
          text: `[Imagem "${b.imageId}" não encontrada — adicione-a no gerenciador de imagens]`,
          italics: true,
          color: "#b00020",
          margin: [0, 6, 0, 6],
        });
      }
    }
    prevWasBloco = b.kind === "heading" && b.level === 0;
    firstNode = false;
  }

  if (!sawHeading && blocks.length === 0) {
    out.push({
      text: "Nenhum conteúdo cadastrado. Cole o corpo do texto no editor.",
      italics: true,
      color: "#8a8a8a",
    });
  }

  out.push(pageBreakAfter());
  return out;
}

// ---------------------------------------------------------------------------
// Exercises (lista de exercícios + gabarito)
// ---------------------------------------------------------------------------

/** A centered, framed exercise image (smaller than body figures, no "Figura N"). */
function exerciseImage(dataUrl: string, caption?: string): Node {
  const frameW = CONTENT_W * 0.6;
  return {
    unbreakable: true,
    margin: [0, 6, 0, 8],
    stack: [
      {
        table: { widths: [frameW], body: [[{ image: dataUrl, fit: [frameW - 14, 300], alignment: "center" }]] },
        layout: {
          hLineWidth: () => 0.75,
          vLineWidth: () => 0.75,
          hLineColor: () => "#cdd8d2",
          vLineColor: () => "#cdd8d2",
          paddingLeft: () => 7,
          paddingRight: () => 7,
          paddingTop: () => 7,
          paddingBottom: () => 7,
          fillColor: () => "#fbfdfc",
        },
        alignment: "center",
      },
      ...(caption ? [{ text: rich(caption), style: "caption", alignment: "center" }] : []),
    ],
  };
}

/** Compact answer key: chunked tables of question number over its answer. */
function compactGabarito(exs: Exercise[], theme: ThemeSettings): Node {
  const perRow = 10;
  const tables: Node[] = [];
  for (let i = 0; i < exs.length; i += perRow) {
    const chunk = exs.slice(i, i + perRow);
    const nums = chunk.map((_, j) => ({
      text: String(i + j + 1),
      bold: true,
      font: "Montserrat",
      fontSize: 9,
      color: "#ffffff",
      fillColor: theme.primary,
      alignment: "center",
      margin: [2, 3, 2, 3],
    }));
    const ans = chunk.map((ex) => ({
      text:
        ex.kind === "objetiva"
          ? ex.correct >= 0
            ? letterFor(ex.correct)
            : "—"
          : "Disc.",
      bold: true,
      font: "Montserrat",
      fontSize: 9,
      color: theme.text,
      alignment: "center",
      margin: [2, 3, 2, 3],
    }));
    tables.push({
      table: { body: [nums, ans], widths: chunk.map(() => "*") },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        hLineColor: () => "#cdd9d2",
        vLineColor: () => "#cdd9d2",
      },
      margin: [0, 0, 0, 8],
    });
  }
  return { stack: tables, unbreakable: tables.length === 1 };
}

function exercisesSection(apg: APG, theme: ThemeSettings): Node[] {
  const exs = apg.exercises ?? [];
  if (exs.length === 0) return [];
  const out: Node[] = [];

  // Title — a per-APG TOC entry. Relies on the preceding section's page break
  // (no forced break here, to avoid an extra blank page).
  out.push({
    text: "Lista de Exercícios",
    style: "h1",
    tocItem: `apg_${apg.id}`,
    tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
    tocMargin: [0, 6, 0, 0],
  });
  out.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
    margin: [0, 2, 0, 10],
  });

  // Questions (no answers shown here).
  exs.forEach((ex, i) => {
    const n = i + 1;
    out.push({
      text: [{ text: `${n}. `, bold: true, color: theme.primary }, ...inline(ex.statement)],
      style: "paragraph",
      margin: [0, 8, 0, 4],
    });
    if (ex.imageDataUrl && ex.imageDataUrl.startsWith("data:")) {
      out.push(exerciseImage(ex.imageDataUrl, ex.imageCaption));
    }
    if (ex.kind === "objetiva") {
      ex.options.forEach((opt, oi) => {
        out.push({
          text: [{ text: `${letterFor(oi)}) `, bold: true, color: theme.accent }, ...inline(opt)],
          style: "paragraph",
          margin: [18, 1, 0, 1],
        });
      });
    } else {
      // Discursive — leave a few ruled lines for the answer.
      for (let k = 0; k < 3; k++) {
        out.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.5, lineColor: "#d7e2db", dash: { length: 2 } }],
          margin: [0, 10, 0, 0],
        });
      }
    }
  });

  // Compact answer key — on a fresh page.
  out.push({
    text: "Gabarito",
    style: "h1",
    tocItem: `apg_${apg.id}`,
    tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
    tocMargin: [0, 6, 0, 0],
    pageBreak: "before",
  });
  out.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
    margin: [0, 2, 0, 12],
  });
  out.push(compactGabarito(exs, theme));

  // Commented answers.
  out.push({ text: "Respostas Comentadas", style: "h2", margin: [0, 14, 0, 6] });
  exs.forEach((ex, i) => {
    const respLabel =
      ex.kind === "objetiva"
        ? `Resposta: ${ex.correct >= 0 ? letterFor(ex.correct) : "—"}`
        : "Resposta esperada";
    out.push({
      text: [
        { text: `${i + 1}. `, bold: true, color: theme.primary },
        { text: respLabel, bold: true, color: theme.accent },
      ],
      style: "paragraph",
      margin: [0, 8, 0, 2],
    });
    if (ex.kind === "discursiva" && ex.answer) {
      out.push({ text: inline(ex.answer), style: "paragraph", margin: [14, 0, 0, 3] });
    }
    if (ex.explanation) {
      out.push({ text: inline(ex.explanation), style: "paragraph", margin: [14, 0, 0, 3] });
    }
  });

  out.push(pageBreakAfter());
  return out;
}

/** A small grey caption naming the source APG of an exercise. */
function apgTag(label: string): Node {
  return {
    text: label,
    font: "Montserrat",
    fontSize: 7,
    color: "#8a9a92",
    characterSpacing: 0.4,
    margin: [0, 8, 0, 1],
  };
}

/**
 * Consolidated "Lista Geral de Exercícios": every exercise from every APG,
 * gathered at the end of the document with a small tag above each one naming
 * its source APG. Continuous numbering; shared compact answer key + comments.
 * Entered into the global summary (mainToc). Optional (export setting).
 */
function generalExercisesSection(apgs: APG[], theme: ThemeSettings): Node[] {
  const all: { ex: Exercise; label: string }[] = [];
  apgs.forEach((apg) => {
    (apg.exercises ?? []).forEach((ex) =>
      all.push({ ex, label: `APG ${apg.numero} — ${apg.titulo || "Sem título"}` })
    );
  });
  if (all.length === 0) return [];

  const out: Node[] = [];
  out.push({
    text: "Lista Geral de Exercícios",
    style: "h1",
    tocItem: "mainToc",
    tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
    tocMargin: [0, 6, 0, 0],
    pageBreak: "before",
    id: "apghdr|clear", // stop the per-APG running header on these pages
  });
  out.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
    margin: [0, 2, 0, 8],
  });
  out.push({
    text: `Todas as ${all.length} questões deste caderno, reunidas para revisão.`,
    font: "Tinos",
    italics: true,
    fontSize: 11,
    color: theme.accent,
    margin: [0, 0, 0, 6],
  });

  // Questions (with source-APG tags), continuous numbering.
  all.forEach(({ ex, label }, i) => {
    out.push(apgTag(label));
    out.push({
      text: [{ text: `${i + 1}. `, bold: true, color: theme.primary }, ...inline(ex.statement)],
      style: "paragraph",
      margin: [0, 0, 0, 4],
    });
    if (ex.imageDataUrl && ex.imageDataUrl.startsWith("data:")) {
      out.push(exerciseImage(ex.imageDataUrl, ex.imageCaption));
    }
    if (ex.kind === "objetiva") {
      ex.options.forEach((opt, oi) => {
        out.push({
          text: [{ text: `${letterFor(oi)}) `, bold: true, color: theme.accent }, ...inline(opt)],
          style: "paragraph",
          margin: [18, 1, 0, 1],
        });
      });
    } else {
      for (let k = 0; k < 3; k++) {
        out.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.5, lineColor: "#d7e2db", dash: { length: 2 } }],
          margin: [0, 10, 0, 0],
        });
      }
    }
  });

  // Shared compact answer key — fresh page.
  out.push({
    text: "Gabarito Geral",
    style: "h1",
    tocItem: "mainToc",
    tocStyle: { font: "Montserrat", bold: true, fontSize: 11, color: theme.primary },
    tocMargin: [0, 6, 0, 0],
    pageBreak: "before",
  });
  out.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
    margin: [0, 2, 0, 12],
  });
  out.push(compactGabarito(all.map((a) => a.ex), theme));

  // Commented answers (tagged by APG).
  out.push({ text: "Respostas Comentadas", style: "h2", margin: [0, 14, 0, 6] });
  all.forEach(({ ex, label }, i) => {
    out.push(apgTag(label));
    const respLabel =
      ex.kind === "objetiva"
        ? `Resposta: ${ex.correct >= 0 ? letterFor(ex.correct) : "—"}`
        : "Resposta esperada";
    out.push({
      text: [
        { text: `${i + 1}. `, bold: true, color: theme.primary },
        { text: respLabel, bold: true, color: theme.accent },
      ],
      style: "paragraph",
      margin: [0, 0, 0, 2],
    });
    if (ex.kind === "discursiva" && ex.answer) {
      out.push({ text: inline(ex.answer), style: "paragraph", margin: [14, 0, 0, 3] });
    }
    if (ex.explanation) {
      out.push({ text: inline(ex.explanation), style: "paragraph", margin: [14, 0, 0, 3] });
    }
  });

  out.push(pageBreakAfter());
  return out;
}

// ---------------------------------------------------------------------------
// Advertisements with QR codes — a product showcase before the summary plus a
// rotating single ad after each APG.
// ---------------------------------------------------------------------------

/** A single product ad card (text + QR). `compact` packs several per page. */
function adCard(p: AdProduct, theme: ThemeSettings, compact = false): Node {
  const qrW = compact ? 82 : 118;
  const qrCol = compact ? 112 : 150;
  const pad = compact ? 12 : 16;
  const left: Node = {
    stack: [
      {
        text: p.kicker,
        font: "Montserrat",
        bold: true,
        fontSize: compact ? 7.5 : 8,
        characterSpacing: 1.5,
        color: theme.accent,
        margin: [0, 0, 0, compact ? 3 : 5],
      },
      {
        text: p.headline,
        font: "Montserrat",
        bold: true,
        fontSize: compact ? 13 : 16,
        color: theme.primary,
        link: p.ctaUrl,
        lineHeight: 1.12,
        margin: [0, 0, 0, compact ? 4 : 6],
      },
      {
        text: p.body,
        fontSize: compact ? 9.5 : 10.5,
        color: theme.text,
        alignment: "left",
        lineHeight: 1.3,
        margin: [0, 0, 0, compact ? 8 : 12],
      },
      {
        // Solid "button": a text run with a filled background (highlight). This
        // always paints — a nested-table fillColor (2 levels deep) does not
        // reliably render in pdfmake and left the button white/invisible.
        // Spaces pad it horizontally; lineHeight gives it height like a pill.
        text: [
          `   ${p.cta}  `,
          { text: "→", font: "DejaVuSerif", background: theme.primary, color: "#ffffff", bold: true },
          "   ",
        ],
        font: "Montserrat",
        bold: true,
        fontSize: compact ? 9.5 : 11,
        color: "#ffffff",
        background: theme.primary,
        link: p.ctaUrl,
        lineHeight: compact ? 1.7 : 1.8,
        margin: [0, 0, 0, compact ? 8 : 11],
      },
      {
        text: [
          { text: "Acesse: ", color: "#7c8c84", fontSize: compact ? 8 : 9 },
          {
            text: p.displayUrl,
            link: p.ctaUrl,
            color: theme.accent,
            fontSize: compact ? 8 : 9,
            decoration: "underline",
          },
        ],
      },
    ],
    margin: [2, 2, 8, 2],
  };

  const right: Node = {
    stack: [
      { image: qrName(p.slug), width: qrW, alignment: "center", link: p.ctaUrl },
      {
        text: "Aponte a câmera",
        font: "Montserrat",
        fontSize: 7.5,
        color: "#7c8c84",
        alignment: "center",
        margin: [0, 5, 0, 0],
      },
    ],
    margin: [6, 4, 2, 2],
  };

  return {
    unbreakable: true,
    margin: [0, compact ? 0 : 16, 0, compact ? 12 : 0],
    table: { widths: ["*", qrCol], body: [[left, right]] },
    layout: {
      fillColor: () => "#f1f7f3",
      hLineColor: () => theme.accent,
      vLineColor: () => theme.accent,
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      paddingLeft: () => pad,
      paddingRight: () => pad,
      paddingTop: () => pad,
      paddingBottom: () => pad,
    },
  };
}

/** Showcase of every product, placed before the global summary. */
function adsShowcaseSection(theme: ThemeSettings): Node[] {
  const out: Node[] = [
    { text: "A plataforma DomineAqui", style: "sectionTitle", margin: [0, 0, 0, 4], pageBreak: "before" },
    {
      text: "Muito além das APGs — tudo o que preparamos para você dominar a Medicina:",
      font: "Tinos",
      italics: true,
      fontSize: 11,
      color: theme.accent,
      margin: [0, 0, 0, 14],
    },
  ];
  AD_PRODUCTS.forEach((p) => out.push(adCard(p, theme, true)));
  out.push(pageBreakAfter());
  return out;
}

/** One full-size ad (rotated per APG) on its own page. */
function singleAdSection(theme: ThemeSettings, p: AdProduct): Node[] {
  return [
    { text: "Continue aprofundando", style: "h2", alignment: "center", margin: [0, 0, 0, 4] },
    adCard(p, theme, false),
    pageBreakAfter(),
  ];
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

interface DocOptions {
  /** Append a consolidated "Lista Geral de Exercícios" (all APGs) at the end. */
  generalExercises?: boolean;
  /** Produce a compact "Resumo de Objetivos" document instead of the full
   *  caderno: cover + each APG's learning objectives, grouped by period. */
  objectivesOnly?: boolean;
  /** In objectives-only mode, also list each APG's content topics ("temas"). */
  includeTemas?: boolean;
}

// Running-header context — which APG owns each page. Lives OUTSIDE the document
// definition so the two export passes can share it while each uses a FRESH def
// object (pdfmake mutates content nodes during render, so reusing one def across
// passes corrupts canvas/layout — that caused huge gaps after PARTE titles).
type HdrInfo = { numero: number; periodo: number; titulo: string } | null;
interface HeaderCtx {
  runHeaders: { page: number; info: HdrInfo }[];
  coverPages: Set<number>;
  seenMarkers: Set<string>;
}
function makeHeaderCtx(): HeaderCtx {
  return { runHeaders: [], coverPages: new Set(), seenMarkers: new Set() };
}

function buildDocDefinition(
  apgs: APG[],
  theme: ThemeSettings,
  opts: DocOptions = {},
  headerCtx?: HeaderCtx
): TDocumentDefinitions {
  // Order APGs by period then number for a coherent caderno.
  const ordered = [...apgs].sort((a, b) =>
    a.periodo !== b.periodo ? a.periodo - b.periodo : a.numero - b.numero
  );
  const periodos = [...new Set(ordered.map((a) => a.periodo))].sort((a, b) => a - b);

  // Running-header map: populated during layout via pageBreakBefore (markers
  // carry the APG info in their id), read by header(). Shared across the two
  // export passes when a headerCtx is supplied.
  const ctx = headerCtx ?? makeHeaderCtx();
  const { runHeaders, coverPages, seenMarkers } = ctx;

  const content: Node[] = [];

  if (opts.objectivesOnly) {
    // Compact study summary: cover + each APG's objectives (+ optional temas),
    // grouped by period. No preface/ads/content/exercises, no running header.
    content.push(...generalCover(theme, periodos));
    content.push({
      text: opts.includeTemas ? "Resumo de Objetivos e Temas" : "Resumo de Objetivos",
      style: "h1",
      margin: [0, 0, 0, 2],
    });
    content.push({
      canvas: [{ type: "rect", x: 0, y: 0, w: CONTENT_W, h: 2, color: theme.accent }],
      margin: [0, 2, 0, 10],
    });
    // Sumário: every APG and the page where its objectives start. pdfmake fills
    // in the page numbers from the `tocItem` markers on each APG heading below.
    content.push({
      toc: {
        id: "objToc",
        title: { text: "Sumário — Objetivos por APG", style: "tocTitle" },
      },
    });
    content.push(pageBreakAfter());
    let lastPeriodo = -1;
    let periodCount = 0;
    ordered.forEach((apg) => {
      if (apg.periodo !== lastPeriodo) {
        lastPeriodo = apg.periodo;
        periodCount += 1;
        content.push({
          text: `${apg.periodo}º Período`,
          font: "Montserrat",
          bold: true,
          fontSize: 15,
          color: theme.primary,
          margin: [0, 14, 0, 4],
          // Start each new period on a fresh page (except the first).
          pageBreak: periodCount > 1 ? "before" : undefined,
        });
      }
      content.push(...objectivesOutlineSection(apg, theme, !!opts.includeTemas));
    });
  } else {
    // 1. General cover
    content.push(...generalCover(theme, periodos));

    // 1b. Preface (storytelling + legal / copyright front matter)
    content.push(...prefaceSection(theme));

    // 1c. Product showcase ads (before the summary)
    content.push(...adsShowcaseSection(theme));

    // 2. Global summary
    content.push({
      toc: {
        id: "mainToc",
        title: { text: "Sumário Geral", style: "tocTitle" },
      },
    });
    content.push(pageBreakAfter());

    // 3. Each APG. The objectives title node carries the running-header marker
    // (id "apghdr|…"), captured during layout in pageBreakBefore.
    ordered.forEach((apg, idx) => {
      content.push(...apgCover(apg, theme));
      content.push(...objectivesSection(apg, theme));
      content.push(...apgToc(apg));
      content.push(...contentSection(apg, theme));
      content.push(...exercisesSection(apg, theme));
      // Recurring ad after each APG, rotating through the products.
      content.push(...singleAdSection(theme, AD_PRODUCTS[idx % AD_PRODUCTS.length]));
    });

    // 4. Optional consolidated exercise list (all APGs) at the very end.
    if (opts.generalExercises) {
      content.push(...generalExercisesSection(ordered, theme));
    }
  }

  // Drop trailing page-break sentinels so the document doesn't end on a blank page.
  while (
    content.length &&
    content[content.length - 1] &&
    content[content.length - 1].pageBreak === "after" &&
    content[content.length - 1].text === ""
  ) {
    content.pop();
  }

  return {
    content,
    images: {
      [LOGO_NAME]: LOGO_DATAURL,
      ...Object.fromEntries(AD_PRODUCTS.map((p) => [qrName(p.slug), QR_CODES[p.slug]])),
    },
    pageSize: "A4",
    pageMargins: [M_LEFT, M_TOP, M_RIGHT, M_BOTTOM],
    defaultStyle: {
      font: "Tinos",
      fontSize: theme.bodySize,
      color: theme.text,
      lineHeight: 1.5,
      alignment: "justify",
    },
    info: {
      title: `DomineAqui — APGs ${BRAND.area} ${BRAND.year}`,
      author: BRAND.name,
      subject: "Material acadêmico de APGs",
    },
    // Record each APG-marker's page during layout (for the running header). The
    // marker rides the objectives title; the APG cover is the page just before,
    // so we exclude (page - 1) from the header. Deduped so the 2nd render pass
    // doesn't double entries.
    pageBreakBefore: (currentNode: any) => {
      const id: unknown = currentNode?.id;
      const page: unknown = currentNode?.startPosition?.pageNumber;
      if (typeof id === "string" && id.startsWith("apghdr|") && typeof page === "number") {
        if (!seenMarkers.has(id)) {
          seenMarkers.add(id);
          if (id === "apghdr|clear") {
            runHeaders.push({ page, info: null });
          } else {
            const parts = id.split("|");
            runHeaders.push({
              page,
              info: {
                numero: Number(parts[1]),
                periodo: Number(parts[2]),
                titulo: decodeURIComponent(parts.slice(3).join("|")),
              },
            });
            coverPages.add(page - 1);
          }
        }
      }
      return false;
    },
    // Running header: APG number + title (left), period (right). Not on covers.
    header: (currentPage: number) => {
      if (coverPages.has(currentPage)) return undefined;
      let info: HdrInfo = null;
      let best = -1;
      for (const e of runHeaders) {
        if (e.page <= currentPage && e.page > best) {
          best = e.page;
          info = e.info;
        }
      }
      if (!info) return undefined;
      const title = info.titulo || "Sem título";
      let left = `APG ${info.numero} — ${title}`;
      if (left.length > 74) left = left.slice(0, 72) + "…";
      return {
        margin: [M_LEFT, 30, M_RIGHT, 0],
        columns: [
          {
            text: left,
            font: "Montserrat",
            fontSize: 8,
            color: theme.accent,
            width: "*",
            noWrap: true,
          },
          {
            text: `${info.periodo}º Período`,
            font: "Montserrat",
            fontSize: 8,
            bold: true,
            color: theme.primary,
            width: "auto",
            alignment: "right",
          },
        ],
      };
    },
    footer: (currentPage: number) => ({
      margin: [M_LEFT, 6, M_RIGHT, 0],
      columns: [
        // Brand logo on every page (referenced from the doc-level images map).
        { image: LOGO_NAME, width: 16, margin: [0, 1, 6, 0] },
        {
          text: BRAND.notice,
          font: "Montserrat",
          fontSize: 6,
          color: "#7c8c84",
          width: "*",
          alignment: "left",
          lineHeight: 1.1,
          margin: [0, 2, 0, 0],
        },
        {
          text: String(currentPage),
          font: "Montserrat",
          fontSize: 9,
          bold: true,
          color: theme.primary,
          width: 28,
          alignment: "right",
          margin: [0, 2, 0, 0],
        },
      ],
    }),
    styles: {
      sectionTitle: {
        font: "Montserrat",
        bold: true,
        fontSize: theme.titleSize,
        color: theme.primary,
        alignment: "left",
      },
      tocTitle: {
        font: "Montserrat",
        bold: true,
        fontSize: 16,
        color: theme.primary,
        margin: [0, 0, 0, 16],
        alignment: "left",
      },
      h0: {
        font: "Montserrat",
        bold: true,
        fontSize: theme.titleSize + 6,
        color: theme.primary,
        alignment: "left",
        characterSpacing: 0.5,
        margin: [0, 4, 0, 0],
      },
      h1: {
        font: "Montserrat",
        bold: true,
        fontSize: theme.titleSize,
        color: theme.primary,
        alignment: "left",
        margin: [0, 14, 0, 0],
      },
      h2: {
        font: "Montserrat",
        bold: true,
        fontSize: theme.subtitleSize + 1,
        color: theme.primary,
        alignment: "left",
        margin: [0, 12, 0, 4],
      },
      h3: {
        font: "Montserrat",
        bold: true,
        fontSize: theme.subtitleSize,
        color: theme.accent,
        alignment: "left",
        margin: [0, 9, 0, 3],
      },
      paragraph: {
        font: "Tinos",
        fontSize: theme.bodySize,
        alignment: "justify",
        margin: [0, 0, 0, 8],
      },
      caption: {
        font: "Montserrat",
        fontSize: 8.5,
        italics: false,
        color: "#5a6b62",
        alignment: "center",
        margin: [0, 6, 0, 0],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Sheet layout: one logical page per sheet, or two side by side (2-up). */
export type LayoutMode = "single" | "duplo";

/** Render one pdfmake document to PDF bytes. */
function renderToBuffer(def: TDocumentDefinitions): Promise<Uint8Array> {
  return new Promise((resolve) => pdfMake.createPdf(def).getBuffer((buf: Uint8Array) => resolve(buf)));
}

/** Render to bytes with the per-APG running headers. Two passes, each with a
 *  FRESH def object sharing one header context: pass 1 populates the page map;
 *  pass 2 draws the headers. (Reusing a single def across passes corrupts
 *  pdfmake's canvas layout — it mutates content nodes during render.) */
async function getPdfBytes(
  apgs: APG[],
  theme: ThemeSettings,
  opts: DocOptions
): Promise<Uint8Array> {
  const ctx = makeHeaderCtx();
  await renderToBuffer(buildDocDefinition(apgs, theme, opts, ctx)); // pass 1: populate ctx
  return renderToBuffer(buildDocDefinition(apgs, theme, opts, ctx)); // pass 2: draw headers
}

/** Hand a PDF byte array to the browser as a download or a new tab. */
function deliver(bytes: Uint8Array, filename: string, how: "download" | "open"): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  if (how === "open") {
    const win = window.open(url, "_blank");
    if (!win) {
      // Popup blocked (window.open after await) — fall back to a download.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

/** Extra export options beyond quality + sheet layout. */
export interface ExportExtras {
  generalExercises?: boolean;
  /** Export only a compact "Resumo de Objetivos" (no full content). */
  objectivesOnly?: boolean;
  /** In objectives-only mode, also list each APG's content topics ("temas"). */
  includeTemas?: boolean;
}

/** Produce the final PDF bytes for the chosen quality + sheet layout. */
async function produce(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode,
  layout: LayoutMode,
  extras: ExportExtras
): Promise<Uint8Array> {
  // Objectives-only export renders no images, so skip the (costly) recompress.
  const optimized = extras.objectivesOnly ? apgs : await optimizeApgs(apgs, mode);
  const bytes = await getPdfBytes(optimized, theme, {
    generalExercises: extras.generalExercises,
    objectivesOnly: extras.objectivesOnly,
    includeTemas: extras.includeTemas,
  });
  return layout === "duplo" ? await impose2up(bytes) : bytes;
}

/** Build the document and trigger a browser download (images optimized by mode). */
export async function downloadPdf(
  apgs: APG[],
  theme: ThemeSettings,
  filename: string,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  if (apgs.length === 0) throw new Error("Nenhuma APG para gerar.");
  const bytes = await produce(apgs, theme, mode, layout, extras);
  const suffix = layout === "duplo" ? "-2porfolha" : "";
  deliver(bytes, `${sanitize(filename)}${suffix}.pdf`, "download");
}

/** Open the generated document in a new tab for previewing. */
export async function openPdf(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  if (apgs.length === 0) throw new Error("Nenhuma APG para gerar.");
  const bytes = await produce(apgs, theme, mode, layout, extras);
  deliver(bytes, "preview.pdf", "open");
}

/** Consolidated PDF with every APG. */
export function generateConsolidated(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  return downloadPdf(apgs, theme, `DomineAqui-APGs-${BRAND.area}-${BRAND.year}`, mode, layout, extras);
}

/** PDF with only the APGs of a given period. */
export function generateByPeriodo(
  apgs: APG[],
  periodo: number,
  theme: ThemeSettings,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  const subset = apgs.filter((a) => a.periodo === periodo);
  if (subset.length === 0) throw new Error(`Nenhuma APG no período ${periodo}.`);
  return downloadPdf(subset, theme, `DomineAqui-Periodo-${periodo}-${BRAND.year}`, mode, layout, extras);
}

/** Compact "Resumo de Objetivos" PDF for every APG (optionally with temas). */
export function generateObjectives(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  const name = extras.includeTemas ? "Resumo-Objetivos-e-Temas" : "Resumo-Objetivos";
  return downloadPdf(apgs, theme, `DomineAqui-${name}-${BRAND.year}`, mode, layout, {
    ...extras,
    objectivesOnly: true,
  });
}

/** Compact "Resumo de Objetivos" PDF for a single period. */
export function generateObjectivesByPeriodo(
  apgs: APG[],
  periodo: number,
  theme: ThemeSettings,
  mode: ExportMode = "equilibrado",
  layout: LayoutMode = "single",
  extras: ExportExtras = {}
): Promise<void> {
  const subset = apgs.filter((a) => a.periodo === periodo);
  if (subset.length === 0) throw new Error(`Nenhuma APG no período ${periodo}.`);
  return downloadPdf(subset, theme, `DomineAqui-Objetivos-Periodo-${periodo}-${BRAND.year}`, mode, layout, {
    ...extras,
    objectivesOnly: true,
  });
}

export { buildDocDefinition };
