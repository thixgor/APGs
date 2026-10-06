// Printable HTML export — the same document the PDF generator would produce, but
// as plain HTML meant to be printed (or "Save as PDF") from the browser.
//
// Unlike generateHtml.ts (the interactive reader), this mirrors generatePdf.ts:
// A4 pages with the PDF's margins, green covers, objectives, per-APG summary,
// content with BLOCO/PARTE starting on a fresh page, exercises + answer key +
// commented answers, product ads, and the copyright footer on every page.
//
// Public API: buildPrintableHtml (one self-contained HTML string) and
// downloadPrintableZip (one HTML per APG or per period, zipped).

import type { APG, APGImage, ContentBlock, ThemeSettings } from "../state/types";
import { BRAND } from "../state/types";
import { parseObjectives } from "../parser/objectivesParser";
import { parseContent } from "../parser/contentParser";
import { letterFor } from "../parser/exerciseParser";
import { inlineToHtml, escapeHtml } from "./inlineHtml";
import { LOGO_DATAURL } from "../pdf/assets/logo";
import { QR_CODES } from "../pdf/assets/qr";
import { AD_PRODUCTS, type AdProduct } from "../pdf/generatePdf";
import { optimizeApgs, ExportMode } from "../utils/optimize";
import { createZip } from "../utils/zip";

/** How the zip is split: one HTML per APG (grouped in period folders) or one per period. */
export type PrintGranularity = "apg" | "periodo";

export interface PrintOptions {
  /** Which period to export; omit for every period. */
  periodo?: number;
  granularity?: PrintGranularity;
  /** Period files only: append the consolidated "Lista Geral de Exercícios". */
  generalExercises?: boolean;
}

const ordered = (apgs: APG[]): APG[] =>
  [...apgs].sort((a, b) => a.periodo - b.periodo || a.numero - b.numero);

const INLINE_TAGS = /\[\/?(?:b|i|u|s|c=[^\]]*|h=[^\]]*|sz=[^\]]*|f=[^\]]*)\]/gi;
/** Text without inline formatting tags (for <title> and file names). */
const plain = (s: string): string => (s ?? "").replace(INLINE_TAGS, "");

const alignStyle = (a?: string): string => (a ? ` style="text-align:${a}"` : "");
const lineStyle = (b: { align?: string; lineHeight?: number }): string => {
  const s: string[] = [];
  if (b.align) s.push(`text-align:${b.align}`);
  if (b.lineHeight) s.push(`line-height:${b.lineHeight}`);
  return s.length ? ` style="${s.join(";")}"` : "";
};

// ---------------------------------------------------------------------------
// Covers
// ---------------------------------------------------------------------------

/** Copyright strip under the cover panel (covers print with no page margins, so
 *  the running footer has to be part of the cover itself). */
function coverNotice(): string {
  return `<div class="cv-notice"><img src="${LOGO_DATAURL}" alt=""><span>${escapeHtml(BRAND.notice)}</span></div>`;
}

function generalCover(periodos: number[]): string {
  const periodLabel =
    periodos.length === 1 ? `Período ${periodos[0]}` : `Períodos ${periodos.join(" · ")}`;
  return `<section class="cover-wrap" id="capa"><div class="cover"><div class="cv-panel">
    <div class="medal big"><img src="${LOGO_DATAURL}" alt=""></div>
    <div class="rule"></div>
    <h1 class="brand-name">${escapeHtml(BRAND.name)}</h1>
    <div class="cv-sub">Material Acadêmico de APGs</div>
    <div class="rule short"></div>
    <div class="cv-area">${escapeHtml(BRAND.area.toUpperCase())}</div>
    <div class="cv-desc">Caderno Consolidado de Aprendizagem Baseada em Pequenos Grupos</div>
    <div class="cv-period">${escapeHtml(periodLabel)}</div>
    <div class="cv-foot"><b>${BRAND.year}</b><span>${escapeHtml(BRAND.site)}</span></div>
    </div>${coverNotice()}</div></section>`;
}

function apgCover(apg: APG): string {
  return `<section class="cover-wrap" id="apg-${apg.id}"><div class="cover"><div class="cv-panel">
    <div class="medal"><img src="${LOGO_DATAURL}" alt=""></div>
    <div class="cv-period">PERÍODO ${apg.periodo}</div>
    <div class="cv-apgnum">APG ${apg.numero}</div>
    <div class="rule short"></div>
    <h1 class="cv-apgtitle">${inlineToHtml(apg.titulo || "Sem título")}</h1>
    <div class="cv-foot"><b>${escapeHtml(BRAND.name)}</b></div>
    </div>${coverNotice()}</div></section>`;
}

// ---------------------------------------------------------------------------
// Preface + product ads
// ---------------------------------------------------------------------------

function prefaceSection(): string {
  return `<section class="page preface">
    <h2 class="section-title">Prefácio</h2>
    <div class="subline">${escapeHtml(BRAND.name)} — Material Acadêmico de APGs</div>
    <p>Eu sempre quis estudar para as APGs de forma aprofundada e sem lacunas. Mas os resumos e materiais que encontrava na internet eram básicos, superficiais e desleixados — além de não serem específicos para o que realmente é cobrado.</p>
    <p>Foi por isso que criamos o DomineAqui. Aqui, abrimos cada objetivo de APG em objetivos específicos, para que você saiba exatamente o que estudar — com base no que importa para as provas e para a Medicina como um todo.</p>
    <p>Este material foi construído para ser completo e sem lacunas: cada tópico é desenvolvido com profundidade, organização e foco no essencial, para que o seu tempo de estudo renda de verdade.</p>
    <p><b>Criadores:</b> Thiago Rodrigues e João Henrique Lemos.</p>
    <h3 class="legal-h">Aviso Legal e Direitos Autorais</h3>
    <p>Nos termos da <b>Lei nº 9.610/1998</b> (Lei de Direitos Autorais), o download deste material é liberado <b>somente para uso individual do titular da conta</b>.</p>
    <p>Este material é protegido por copyright e direitos autorais. A distribuição, o compartilhamento, a revenda, a publicação, a disponibilização em grupos ou plataformas e qualquer repasse a terceiros não são autorizados.</p>
    <div class="legal-links">
      Termos de Serviço: <a href="https://domineaqui.com.br/termos-de-servico">domineaqui.com.br/termos-de-servico</a><br>
      Política de Privacidade: <a href="https://domineaqui.com.br/politica-de-privacidade">domineaqui.com.br/politica-de-privacidade</a><br>
      Termos de Copyright (documento): <a href="https://drive.google.com/file/d/1YjgRZZV_cQQkLdD7SrNGbCdSrzn13sKo/view?usp=sharing">acessar arquivo</a>
    </div>
    <div class="signed">Documento assinado digitalmente em 16/05/2026 às 15:43:51 -0300 via gov.br.</div>
  </section>`;
}

function adCard(p: AdProduct, compact: boolean): string {
  const qr = QR_CODES[p.slug];
  return `<div class="ad${compact ? " compact" : ""}">
    <div class="ad-text">
      <div class="kicker">${escapeHtml(p.kicker)}</div>
      <a class="ad-head" href="${p.ctaUrl}">${escapeHtml(p.headline)}</a>
      <p>${escapeHtml(p.body)}</p>
      <a class="ad-cta" href="${p.ctaUrl}">${escapeHtml(p.cta)} →</a>
      <div class="ad-url">Acesse: <a href="${p.ctaUrl}">${escapeHtml(p.displayUrl)}</a></div>
    </div>
    ${qr ? `<div class="ad-qr"><img src="${qr}" alt="QR ${escapeHtml(p.slug)}"><span>Aponte a câmera</span></div>` : ""}
  </div>`;
}

function adsShowcaseSection(): string {
  return `<section class="page">
    <h2 class="section-title">A plataforma DomineAqui</h2>
    <div class="subline">Muito além das APGs — tudo o que preparamos para você dominar a Medicina:</div>
    ${AD_PRODUCTS.map((p) => adCard(p, true)).join("")}
  </section>`;
}

function singleAdSection(p: AdProduct): string {
  return `<section class="page">
    <h2 class="h2 center">Continue aprofundando</h2>
    ${adCard(p, false)}
  </section>`;
}

// ---------------------------------------------------------------------------
// Objectives
// ---------------------------------------------------------------------------

function objectivesSection(apg: APG): string {
  const generals = parseObjectives(apg.objetivosRaw);
  const body = generals.length
    ? generals
        .map((g) => {
          const specifics = g.specifics
            .map(
              (s) => `<div class="esp"><span class="n">${escapeHtml(s.number)}.</span> ${inlineToHtml(s.title)}</div>${
                s.items.length ? `<ul class="esp-items">${s.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ul>` : ""
              }`
            )
            .join("");
          return `<div class="og">Objetivo Geral ${escapeHtml(g.number)}</div>
            ${g.description ? `<p class="just">${inlineToHtml(g.description)}</p>` : ""}
            ${g.specifics.length ? `<div class="oe">Objetivos Específicos</div>${specifics}` : ""}`;
        })
        .join("")
    : `<p class="empty">Nenhum objetivo cadastrado. Cole o bloco de objetivos no editor.</p>`;
  return `<section class="page" id="obj-${apg.id}">
    <h2 class="section-title">Objetivos de Aprendizagem</h2>
    <div class="subline">APG ${apg.numero} — ${inlineToHtml(apg.titulo)}</div>
    ${body}
  </section>`;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface TocItem {
  id: string;
  label: string; // already HTML
  level: number; // 0..3, 4 = exercises/gabarito entry
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const plainCell = plain;

/** Column weights (share of the table width, in %) — same idea as the PDF's
 *  columnWidths: typical content length, capped so one verbose column can't
 *  starve the others, with a floor so nothing collapses. */
function columnPercents(rows: string[][], cols: number): number[] {
  const weights: number[] = [];
  for (let c = 0; c < cols; c++) {
    const lens = rows.map((r) => plainCell(r[c] ?? "").length).sort((a, b) => a - b);
    const p75 = lens[Math.min(lens.length - 1, Math.floor(lens.length * 0.75))] ?? 1;
    weights.push(clamp(Math.max(p75, lens[lens.length - 1] * 0.45), 5, 44));
  }
  const total = weights.reduce((a, b) => a + b, 0) || cols;
  const floor = Math.min(100 / cols, 8);
  const raw = weights.map((w) => Math.max(floor, (100 * w) / total));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => (w * 100) / sum);
}

function renderTable(b: Extract<ContentBlock, { kind: "table" }>, theme: ThemeSettings): string {
  const cols = Math.max(1, b.header.length);
  const base = Math.max(8, theme.bodySize - 1.5);
  const fs = clamp(base - Math.max(0, cols - 4) * 0.65, 6.5, base);
  const pad = cols >= 7 ? "3pt" : cols >= 5 ? "4pt" : "5pt";
  const pct = columnPercents([b.header, ...b.rows], cols);
  const colgroup = `<colgroup>${pct.map((p) => `<col style="width:${p.toFixed(2)}%">`).join("")}</colgroup>`;
  const head = b.header.map((h) => `<th>${inlineToHtml(h)}</th>`).join("");
  const body = b.rows
    .map((r) => `<tr>${Array.from({ length: cols }, (_, c) => `<td>${inlineToHtml(r[c] ?? "")}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="tbl" style="font-size:${fs}pt;--pad:${pad}">
    ${b.title ? `<div class="tbl-title">${inlineToHtml(b.title)}</div>` : ""}
    <table>${colgroup}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  </div>`;
}

function renderFigure(
  dataUrl: string,
  label: string,
  caption: string | undefined,
  align: string,
  width: "small" | "medium" | "full" | undefined,
  cls = "fig"
): string {
  const w = width === "small" ? 45 : width === "medium" ? 70 : 100;
  const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return `<figure class="${cls}" style="align-items:${justify}">
    <div class="frame" style="width:${w}%"><img src="${dataUrl}" alt="${escapeHtml(caption || label)}"></div>
    ${label || caption ? `<figcaption style="text-align:${align}">${label}${label && caption ? " — " : ""}${caption ? inlineToHtml(caption) : ""}</figcaption>` : ""}
  </figure>`;
}

function contentSection(apg: APG, theme: ThemeSettings, toc: TocItem[]): string {
  const blocks = parseContent(apg.conteudoRaw);
  const imgs = new Map<string, APGImage>(apg.images.map((i) => [i.id, i]));
  const out: string[] = [];
  let figureCount = 0;
  let firstNode = true;
  let prevWasBloco = false;
  let n = 0;

  for (const b of blocks) {
    if (b.kind === "heading") {
      const id = `h-${apg.id}-${n++}`;
      const num = b.number ? `<span class="hn">${escapeHtml(b.number)}</span>` : "";
      const text = b.text ? `${num}${b.number ? "&nbsp;&nbsp;" : ""}${inlineToHtml(b.text)}` : num;
      const tocLabel = `${b.number ? b.number + "&nbsp;" : ""}${inlineToHtml(b.text)}`;
      toc.push({ id, label: tocLabel, level: b.level });
      if (b.level === 0) {
        out.push(`<div class="h0${firstNode ? "" : " pb"}" id="${id}"${lineStyle(b)}>${text}</div><div class="bar3"></div>`);
      } else if (b.level === 1) {
        out.push(`<div class="h1${firstNode || prevWasBloco ? "" : " pb"}" id="${id}"${lineStyle(b)}>${text}</div><div class="bar2"></div>`);
      } else if (b.level === 2) {
        out.push(`<div class="h2" id="${id}"${lineStyle(b)}>${text}</div>`);
      } else {
        out.push(`<div class="h3" id="${id}"${lineStyle(b)}>${text}</div>`);
      }
    } else if (b.kind === "paragraph") {
      out.push(`<p class="para"${lineStyle(b)}>${inlineToHtml(b.text)}</p>`);
    } else if (b.kind === "list") {
      const tag = b.ordered ? "ol" : "ul";
      out.push(`<${tag} class="para"${lineStyle(b)}>${b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</${tag}>`);
    } else if (b.kind === "divider") {
      out.push(`<hr class="sep">`);
    } else if (b.kind === "table") {
      out.push(renderTable(b, theme));
    } else if (b.kind === "image") {
      figureCount += 1;
      const img = imgs.get(b.imageId);
      if (img && img.dataUrl && img.dataUrl.startsWith("data:")) {
        const align = b.align === "right" || b.align === "left" ? b.align : "center";
        out.push(renderFigure(img.dataUrl, `Figura ${figureCount}`, b.caption ?? img.caption, align, b.width));
      } else if (img) {
        out.push(`<p class="warn">[Imagem "${escapeHtml(b.imageId)}" precisa ser reenviada — recuperada sem o arquivo]</p>`);
      } else {
        out.push(`<p class="warn err">[Imagem "${escapeHtml(b.imageId)}" não encontrada — adicione-a no gerenciador de imagens]</p>`);
      }
    }
    prevWasBloco = b.kind === "heading" && b.level === 0;
    firstNode = false;
  }
  if (!blocks.length) {
    out.push(`<p class="empty">Nenhum conteúdo cadastrado. Cole o corpo do texto no editor.</p>`);
  }
  return `<section class="page body">${out.join("\n")}</section>`;
}

// ---------------------------------------------------------------------------
// Per-APG summary
// ---------------------------------------------------------------------------

function apgToc(toc: TocItem[]): string {
  const links = toc
    .map((t) => `<a class="t${t.level}" href="#${t.id}">${t.label}</a>`)
    .join("");
  return `<section class="page"><h2 class="toc-title">Sumário</h2><nav class="toc">${links}</nav></section>`;
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

interface TaggedExercise {
  ex: APG["exercises"][number];
  label?: string; // source-APG tag (general list only), already HTML
}

function questionBlock(t: TaggedExercise, n: number): string {
  const { ex } = t;
  const img =
    ex.imageDataUrl && ex.imageDataUrl.startsWith("data:")
      ? renderFigure(ex.imageDataUrl, "", ex.imageCaption, "center", undefined, "fig ex-fig")
      : "";
  const options =
    ex.kind === "objetiva"
      ? ex.options
          .map((o, i) => `<div class="opt"><b>${letterFor(i)})</b> ${inlineToHtml(o)}</div>`)
          .join("")
      : `<div class="lines"><i></i><i></i><i></i></div>`;
  return `<div class="q">${t.label ? `<div class="apgtag">${t.label}</div>` : ""}
    <p class="para qs"><b class="qn">${n}.</b> ${inlineToHtml(ex.statement)}</p>${img}${options}</div>`;
}

function compactGabarito(list: TaggedExercise[]): string {
  const perRow = 10;
  const tables: string[] = [];
  for (let i = 0; i < list.length; i += perRow) {
    const chunk = list.slice(i, i + perRow);
    const nums = chunk.map((_, j) => `<th>${i + j + 1}</th>`).join("");
    const ans = chunk
      .map(({ ex }) => `<td>${ex.kind === "objetiva" ? (ex.correct >= 0 ? letterFor(ex.correct) : "—") : "Disc."}</td>`)
      .join("");
    tables.push(`<table class="gab"><tr>${nums}</tr><tr>${ans}</tr></table>`);
  }
  return tables.join("");
}

function commentedAnswers(list: TaggedExercise[]): string {
  return list
    .map(({ ex, label }, i) => {
      const resp =
        ex.kind === "objetiva" ? `Resposta: ${ex.correct >= 0 ? letterFor(ex.correct) : "—"}` : "Resposta esperada";
      return `<div class="ans">${label ? `<div class="apgtag">${label}</div>` : ""}
        <p class="para ah"><b class="qn">${i + 1}.</b> <b class="resp">${resp}</b></p>
        ${ex.kind === "discursiva" && ex.answer ? `<p class="para ai">${inlineToHtml(ex.answer)}</p>` : ""}
        ${ex.explanation ? `<p class="para ai">${inlineToHtml(ex.explanation)}</p>` : ""}</div>`;
    })
    .join("");
}

function exercisesSection(apg: APG, toc: TocItem[]): string {
  const exs = apg.exercises ?? [];
  if (!exs.length) return "";
  const list: TaggedExercise[] = exs.map((ex) => ({ ex }));
  const exId = `ex-${apg.id}`;
  const gabId = `gab-${apg.id}`;
  toc.push({ id: exId, label: "Lista de Exercícios", level: 4 });
  toc.push({ id: gabId, label: "Gabarito", level: 4 });
  return `<section class="page" id="${exId}">
    <div class="h1 first">Lista de Exercícios</div><div class="bar2"></div>
    ${list.map((t, i) => questionBlock(t, i + 1)).join("")}
  </section>
  <section class="page" id="${gabId}">
    <div class="h1 first">Gabarito</div><div class="bar2"></div>
    ${compactGabarito(list)}
    <div class="h2">Respostas Comentadas</div>
    ${commentedAnswers(list)}
  </section>`;
}

function generalExercisesSection(apgs: APG[]): string {
  const all: TaggedExercise[] = [];
  apgs.forEach((apg) =>
    (apg.exercises ?? []).forEach((ex) =>
      all.push({ ex, label: escapeHtml(`APG ${apg.numero} — ${apg.titulo || "Sem título"}`) })
    )
  );
  if (!all.length) return "";
  return `<section class="page" id="lista-geral">
    <div class="h1 first">Lista Geral de Exercícios</div><div class="bar2"></div>
    <div class="subline">Todas as ${all.length} questões deste caderno, reunidas para revisão.</div>
    ${all.map((t, i) => questionBlock(t, i + 1)).join("")}
  </section>
  <section class="page" id="gabarito-geral">
    <div class="h1 first">Gabarito Geral</div><div class="bar2"></div>
    ${compactGabarito(all)}
    <div class="h2">Respostas Comentadas</div>
    ${commentedAnswers(all)}
  </section>`;
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

function buildStyles(theme: ThemeSettings, pageRules: string): string {
  const { primary, primaryDark, accent, text } = theme;
  return `
:root{--primary:${primary};--primary-dark:${primaryDark};--accent:${accent};--text:${text};
  --light:#E9F3EE;--muted:#A9C7B9;--line:#cdd9d2;--soft:#f1f7f3;
  --serif:'Tinos','Times New Roman',Times,Georgia,serif;
  --sans:'Montserrat','Segoe UI',Arial,Helvetica,sans-serif}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#dfe7e2;color:var(--text);font-family:var(--serif);
  font-size:${theme.bodySize}pt;line-height:1.5;text-align:justify;hyphens:auto}
a{color:inherit}

/* ---- on-screen toolbar (never printed) ---- */
.toolbar{position:sticky;top:0;z-index:20;display:flex;gap:12px;align-items:center;flex-wrap:wrap;
  padding:10px 16px;background:var(--primary-dark);color:#fff;font-family:var(--sans);font-size:13px}
.toolbar b{font-size:14px}.toolbar .tip{opacity:.8;font-size:12px;flex:1 1 260px}
.toolbar button{font:700 13px var(--sans);padding:8px 16px;border:0;border-radius:8px;cursor:pointer;
  background:var(--light);color:var(--primary-dark)}
.doc{width:210mm;max-width:100%;margin:16px auto;background:#fff;
  padding:24mm 20mm 22mm 30mm;box-shadow:0 6px 30px rgba(0,0,0,.18)}

/* ---- covers ---- */
.cover-wrap{break-before:page;break-after:page;page:cover}
.cover{margin:10mm -20mm 10mm -30mm;background:#fff}
.cv-panel{position:relative;height:272mm;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;color:var(--light);
  background:var(--primary-dark);border-bottom:2mm solid var(--accent);padding:0 22mm}
.cv-notice{height:25mm;display:flex;align-items:center;gap:6pt;padding:0 20mm 0 30mm;
  font:6pt/1.1 var(--sans);color:#7c8c84;text-align:left}
.cv-notice img{width:16pt;height:auto}
.cv-panel .medal{width:34mm;height:34mm;border-radius:50%;background:var(--light);display:flex;
  align-items:center;justify-content:center;margin-bottom:14mm}
.cv-panel .medal img{width:62%;height:auto}
.cv-panel .medal.big{width:41mm;height:41mm}
.cv-panel .rule{width:39mm;height:1mm;background:var(--accent);margin:0 auto 10mm}
.cv-panel .rule.short{width:21mm;margin:9mm auto}
.cv-panel .brand-name{font:800 46pt var(--sans);letter-spacing:1pt;margin:0 0 8mm;color:var(--light)}
.cv-panel .cv-sub{font:400 13pt var(--sans);letter-spacing:3pt;color:var(--muted)}
.cv-panel .cv-area{font:800 30pt var(--sans);letter-spacing:6pt;margin-top:34mm}
.cv-panel .cv-desc{font:italic 13pt var(--serif);color:var(--muted);margin-top:10mm;max-width:130mm}
.cv-panel .cv-period{font:400 12pt var(--sans);letter-spacing:4pt;color:var(--muted);margin-top:18mm}
.cv-panel .cv-apgnum{font:800 54pt var(--sans);margin-top:12mm;line-height:1.1}
.cv-panel .cv-apgtitle{font:700 24pt var(--serif);margin:0;line-height:1.25;color:var(--light)}
.cv-panel .cv-foot{position:absolute;left:0;right:0;bottom:16mm;font:400 9pt var(--sans);letter-spacing:1pt;
  color:var(--muted);display:flex;flex-direction:column;gap:2mm}
.cv-panel .cv-foot b{font:800 14pt var(--sans);color:var(--light)}

/* ---- sections / headings ---- */
.page{break-before:page;break-after:auto}
@media screen{.page{margin-top:14mm}}
.section-title{font:800 ${theme.titleSize}pt var(--sans);color:var(--primary);margin:0 0 2pt;text-align:left}
.subline{font:italic 10.5pt var(--serif);color:var(--accent);margin:0 0 14pt;text-align:left}
.toc-title{font:800 16pt var(--sans);color:var(--primary);margin:0 0 16pt;text-align:left}
.h0{font:800 ${theme.titleSize + 6}pt var(--sans);color:var(--primary);letter-spacing:.5pt;margin:4pt 0 0;text-align:left;break-after:avoid}
.h1{font:800 ${theme.titleSize}pt var(--sans);color:var(--primary);margin:14pt 0 0;text-align:left;break-after:avoid}
.h2{font:800 ${theme.subtitleSize + 1}pt var(--sans);color:var(--primary);margin:12pt 0 4pt;text-align:left;break-after:avoid}
.h3{font:700 ${theme.subtitleSize}pt var(--sans);color:var(--accent);margin:9pt 0 3pt;text-align:left;break-after:avoid}
.h0 .hn{color:var(--primary)}.h1 .hn,.h3 .hn{color:var(--accent)}.h2 .hn{color:var(--primary)}
.pb{break-before:page}
.h1.first{margin-top:0}
.bar3{height:3pt;background:var(--primary);margin:3pt 0 12pt}
.bar2{height:2pt;background:var(--accent);margin:2pt 0 10pt}
.page.body > :first-child{margin-top:0}
.center{text-align:center}
.para{font-size:${theme.bodySize}pt;margin:0 0 8pt}
ul.para,ol.para{padding-left:22pt;margin-left:0}
hr.sep{border:0;border-top:.75pt solid var(--line);margin:8pt 0 12pt}
.warn{font-style:italic;color:#b45309}.warn.err{color:#b00020}.empty{font-style:italic;color:#8a8a8a}
.just{text-align:justify;margin:0 0 6pt}

/* ---- objectives ---- */
.og{font:800 13pt var(--sans);color:var(--primary);margin:12pt 0 4pt;text-align:left;break-after:avoid}
.oe{font:800 11pt var(--sans);color:var(--accent);margin:6pt 0;text-align:left;break-after:avoid}
.esp{font:700 12pt var(--serif);margin:6pt 0 2pt;text-align:left;break-after:avoid}
.esp .n{color:var(--primary)}
.esp-items{margin:0 0 4pt;padding-left:26pt;line-height:1.4}

/* ---- summary ---- */
.toc{display:flex;flex-direction:column;text-align:left}
.toc a{text-decoration:none;color:var(--text);font-size:10pt;line-height:1.35}
.toc a.t0{font:800 12pt var(--sans);color:var(--primary);margin-top:8pt}
.toc a.t1{font:800 11pt var(--sans);color:var(--primary);margin-top:6pt}
.toc a.t2{font-weight:700;margin:2pt 0 0 16pt}
.toc a.t3{font-size:9pt;color:#444;margin:1pt 0 0 30pt}
.toc a.t4{font:800 11pt var(--sans);color:var(--primary);margin-top:6pt}

/* ---- tables ---- */
.tbl{margin:10pt 0 14pt;font-family:var(--serif)}
.tbl-title{font:800 ${Math.max(9, theme.bodySize - 1)}pt var(--sans);color:var(--primary);text-align:center;margin-bottom:6pt}
.tbl table{width:100%;border-collapse:collapse;table-layout:fixed;border:.5pt solid var(--line)}
.tbl th,.tbl td{padding:var(--pad);border:.5pt solid var(--line);text-align:left;vertical-align:top;
  overflow-wrap:anywhere;word-break:break-word;line-height:1.25}
.tbl thead{display:table-header-group}
.tbl th{background:var(--primary);color:#fff;font-family:var(--sans);font-weight:700}
.tbl tbody tr:nth-child(even) td{background:var(--soft)}
.tbl tr{break-inside:avoid}

/* ---- figures ---- */
.fig{display:flex;flex-direction:column;margin:12pt 0 16pt;break-inside:avoid}
.fig .frame{border:.75pt solid #cdd8d2;background:#fbfdfc;padding:9pt;text-align:center}
.fig img{max-width:100%;max-height:480pt;object-fit:contain}
.fig figcaption{font:8.5pt var(--sans);color:#5a6b62;margin-top:6pt;width:100%}
.ex-fig{margin:6pt 0 8pt}.ex-fig .frame{width:60%!important;padding:7pt}.ex-fig img{max-height:300pt}

/* ---- exercises ---- */
.q{break-inside:avoid-page}.qs{margin:8pt 0 4pt}
.qn{color:var(--primary)}
.opt{margin:1pt 0 1pt 18pt;font-size:${theme.bodySize}pt;text-align:justify}.opt b{color:var(--accent)}
.lines i{display:block;height:20pt;border-bottom:.5pt dashed #d7e2db}
.apgtag{font:7pt var(--sans);color:#8a9a92;letter-spacing:.4pt;margin:8pt 0 1pt;text-align:left}
table.gab{width:100%;border-collapse:collapse;margin:0 0 8pt;table-layout:fixed;break-inside:avoid}
table.gab th{background:var(--primary);color:#fff;font:700 9pt var(--sans);padding:3pt 2pt;text-align:center;border:.6pt solid var(--line)}
table.gab td{font:700 9pt var(--sans);padding:3pt 2pt;text-align:center;border:.6pt solid var(--line)}
.ans{break-inside:avoid}.ah{margin:8pt 0 2pt}.resp{color:var(--accent)}.ai{margin:0 0 3pt 14pt}

/* ---- preface ---- */
.preface p{font-size:10pt;line-height:1.22;margin:0 0 4pt}
.preface .legal-h{font:800 11.5pt var(--sans);color:var(--primary);margin:10pt 0 4pt;text-align:left}
.legal-links{font-size:10pt;line-height:1.25;margin:3pt 0 8pt;text-align:left}
.legal-links a,.ad a{color:#1565a8}
.signed{font:italic 8.5pt var(--sans);color:#5a6b62;border-top:.5pt solid var(--line);margin-top:8pt;padding-top:6pt;text-align:left}

/* ---- ads ---- */
.ad{display:flex;gap:14pt;align-items:center;background:var(--soft);border:1pt solid var(--accent);
  padding:16pt;margin:16pt 0 0;break-inside:avoid;text-align:left}
.ad.compact{padding:12pt;margin:0 0 12pt}
.ad-text{flex:1}.ad-qr{width:118pt;text-align:center;font:7.5pt var(--sans);color:#7c8c84}
.ad.compact .ad-qr{width:82pt}.ad-qr img{width:100%;display:block;margin-bottom:5pt}
.kicker{font:800 8pt var(--sans);letter-spacing:1.5pt;color:var(--accent);margin-bottom:5pt}
.ad-head{display:block;font:800 16pt/1.12 var(--sans);color:var(--primary)!important;text-decoration:none;margin-bottom:6pt}
.ad.compact .ad-head{font-size:13pt}
.ad p{font-size:10.5pt;line-height:1.3;margin:0 0 12pt;text-align:left}.ad.compact p{font-size:9.5pt;margin-bottom:8pt}
.ad-cta{display:inline-block;background:var(--primary);color:#fff!important;font:800 11pt var(--sans);
  padding:6pt 14pt;text-decoration:none;margin-bottom:10pt}
.ad.compact .ad-cta{font-size:9.5pt;margin-bottom:8pt}
.ad-url{font:9pt var(--sans);color:#7c8c84}.ad-url a{color:var(--accent)}

/* ---- print ---- */
@media print{
  body{background:#fff}
  .toolbar{display:none}
  .doc{width:auto;margin:0;padding:0;box-shadow:none}
  .cover{margin:0;width:210mm;height:297mm}
}
${pageRules}
`;
}

// ---------------------------------------------------------------------------
// Page rules — running header/footer through @page margin boxes
// ---------------------------------------------------------------------------

/** A CSS string literal ("…") for `content:`. */
const cssString = (s: string): string =>
  `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;

/**
 * Print geometry, mirroring the PDF: A4 with 3cm/2cm margins, a copyright footer
 * with the page number on every page, covers with no margins (full bleed), and a
 * per-APG running header (APG number + title, period on the right). `position:
 * fixed` is unreliable for repeating elements in paged media, so the header and
 * footer are @page margin boxes (Chrome/Edge); browsers without margin-box
 * support simply print without them.
 */
function pageRules(apgs: APG[], theme: ThemeSettings): string {
  const box = `font-family:'Montserrat','Segoe UI',Arial,sans-serif;vertical-align:top`;
  const rules = [
    `@page{size:A4;margin:30mm 20mm 25mm 30mm;
      @bottom-left{content:${cssString(BRAND.notice)};${box};font-size:6pt;line-height:1.1;color:#7c8c84;
        padding:5mm 6mm 0 22pt;width:84%;background:url("${LOGO_DATAURL}") no-repeat left 4.6mm/16pt auto}
      @bottom-right{content:counter(page);${box};font-size:9pt;font-weight:700;color:${theme.primary};
        text-align:right;padding-top:5mm}}`,
    `@page cover{margin:0}`,
  ];
  apgs.forEach((a, i) => {
    let left = `APG ${a.numero} — ${plain(a.titulo) || "Sem título"}`;
    if (left.length > 74) left = left.slice(0, 72) + "…";
    rules.push(
      `@page apg${i}{@top-left{content:${cssString(left)};${box};font-size:8pt;color:${theme.accent};
        vertical-align:bottom;padding-bottom:6mm;width:80%;white-space:nowrap;overflow:hidden}
        @top-right{content:${cssString(`${a.periodo}º Período`)};${box};font-size:8pt;font-weight:700;
        color:${theme.primary};text-align:right;vertical-align:bottom;padding-bottom:6mm}}`
    );
  });
  return rules.join("\n");
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

export interface PrintDocOptions {
  generalExercises?: boolean;
}

/** One self-contained printable HTML document for the given APGs. A single-APG
 *  document starts at that APG's cover (with a running header); several APGs get
 *  the general cover, preface, product showcase and global summary first. */
export function buildPrintableHtml(apgs: APG[], theme: ThemeSettings, opts: PrintDocOptions = {}): string {
  const list = ordered(apgs);
  const periodos = [...new Set(list.map((a) => a.periodo))].sort((a, b) => a - b);
  const single = list.length === 1 ? list[0] : null;

  const parts: string[] = [];
  if (!single) {
    parts.push(generalCover(periodos));
    parts.push(prefaceSection());
    parts.push(adsShowcaseSection());
    parts.push(
      `<section class="page"><h2 class="toc-title">Sumário Geral</h2><nav class="toc">${
        list
          .map((a) => `<a class="t1" href="#apg-${a.id}">APG ${a.numero} — ${inlineToHtml(a.titulo || "Sem título")} <span style="font-weight:400;font-size:9pt">· ${a.periodo}º período</span></a>`)
          .join("")
      }${
        opts.generalExercises && list.some((a) => (a.exercises ?? []).length)
          ? `<a class="t1" href="#lista-geral">Lista Geral de Exercícios</a><a class="t1" href="#gabarito-geral">Gabarito Geral</a>`
          : ""
      }</nav></section>`
    );
  }

  list.forEach((apg, idx) => {
    const toc: TocItem[] = [];
    parts.push(apgCover(apg));
    const content = contentSection(apg, theme, toc);
    const exercises = exercisesSection(apg, toc);
    // Everything after the cover belongs to the named page "apgN", which carries
    // this APG's running header (see pageRules).
    parts.push(
      `<div class="apg-pages" style="page:apg${idx}">${objectivesSection(apg)}${apgToc(toc)}${content}${exercises}${singleAdSection(
        AD_PRODUCTS[idx % AD_PRODUCTS.length]
      )}</div>`
    );
  });

  if (opts.generalExercises && !single) parts.push(generalExercisesSection(list));

  const title = single
    ? `APG ${single.numero} — ${plain(single.titulo) || "Sem título"}`
    : periodos.length === 1
      ? `APGs — ${periodos[0]}º período`
      : "Caderno de APGs";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · ${escapeHtml(BRAND.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>${buildStyles(theme, pageRules(list, theme))}</style>
</head>
<body>
<div class="toolbar">
  <b>${escapeHtml(title)}</b>
  <span class="tip">Para obter o PDF: clique em imprimir, escolha “Salvar como PDF”, papel A4, e ative “Gráficos de plano de fundo”.</span>
  <button type="button" onclick="window.print()">🖨 Imprimir / Salvar como PDF</button>
</div>
<main class="doc">
${parts.join("\n")}
</main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// ZIP delivery
// ---------------------------------------------------------------------------

function sanitize(name: string): string {
  return (
    plain(name)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "material"
  );
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Zip of printable HTML files — every period, or just `opts.periodo`.
 *  - granularity "apg":     Periodo-N/APG-NN-titulo.html (one file per APG)
 *  - granularity "periodo": DomineAqui-Periodo-N.html    (one file per period)
 */
export async function downloadPrintableZip(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode,
  opts: PrintOptions = {}
): Promise<void> {
  const subset = ordered(apgs).filter((a) => opts.periodo === undefined || a.periodo === opts.periodo);
  if (!subset.length) {
    throw new Error(opts.periodo === undefined ? "Nenhuma APG para gerar." : `Nenhuma APG no período ${opts.periodo}.`);
  }
  const granularity = opts.granularity ?? "apg";
  const optimized = await optimizeApgs(subset, mode);
  const enc = new TextEncoder();
  const entries: { name: string; data: Uint8Array }[] = [];

  if (granularity === "periodo") {
    const periodos = [...new Set(optimized.map((a) => a.periodo))].sort((a, b) => a - b);
    for (const p of periodos) {
      const html = buildPrintableHtml(
        optimized.filter((a) => a.periodo === p),
        theme,
        { generalExercises: opts.generalExercises }
      );
      entries.push({ name: `DomineAqui-Periodo-${pad2(p)}.html`, data: enc.encode(html) });
      await new Promise((r) => setTimeout(r, 0)); // let the UI breathe between files
    }
  } else {
    for (const apg of optimized) {
      const html = buildPrintableHtml([apg], theme);
      const name = `Periodo-${pad2(apg.periodo)}/APG-${pad2(apg.numero)}-${sanitize(apg.titulo)}.html`;
      entries.push({ name, data: enc.encode(html) });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const blob = await createZip(entries);
  const scope = opts.periodo === undefined ? "Todos-os-periodos" : `Periodo-${pad2(opts.periodo)}`;
  download(blob, `DomineAqui-HTML-Imprimivel-${scope}.zip`);
}
