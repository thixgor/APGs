// Interactive HTML ("experience") export — a self-contained .html file the user
// can upload to any host; it IS the reader (no server needed). Parallel to
// generatePdf.ts: same data + parsers, a different rendering layer.
//
// Public API: downloadHtmlBook / downloadHtmlByPeriodo / downloadHtmlApg. Each
// optimizes embedded images for the chosen quality mode (reusing the PDF
// pipeline's optimizeApgs), builds one HTML string with CSS+JS+images inlined,
// and hands it to the browser as a download or a new tab.

import type { APG, APGImage, ContentBlock, ThemeSettings } from "../state/types";
import { BRAND } from "../state/types";
import { parseObjectives } from "../parser/objectivesParser";
import { parseContent } from "../parser/contentParser";
import { inlineToHtml, escapeHtml } from "./inlineHtml";
import { buildStyles, RUNTIME_JS } from "./htmlTemplate";
import { LOGO_DATAURL } from "../pdf/assets/logo";
import { AD_PRODUCTS, type AdProduct } from "../pdf/generatePdf";
import { QR_CODES } from "../pdf/assets/qr";
import { optimizeApgs, ExportMode } from "../utils/optimize";

export interface HtmlExtras {
  /** Include the DomineAqui product cards (defaults to true). */
  includeAds?: boolean;
}

/** A navigable entry for the table of contents. */
interface TocEntry {
  href: string;
  text: string;
  level: "apg" | 1 | 2 | 3;
}

const ordered = (apgs: APG[]): APG[] =>
  [...apgs].sort((a, b) => a.periodo - b.periodo || a.numero - b.numero);

/** Short deterministic id from a seed — namespaces the reader's localStorage. */
function shortHash(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const alignStyle = (a?: string): string =>
  a ? ` style="text-align:${a === "justify" ? "justify" : a}"` : "";

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderObjectives(apg: APG, objId: string): string {
  const generals = parseObjectives(apg.objetivosRaw);
  if (!generals.length) return "";
  const blocks = generals
    .map((g) => {
      const esp = g.specifics
        .map((s) => {
          const items = s.items.length
            ? `<ul>${s.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ul>`
            : "";
          return `<li><span class="esp-title">${escapeHtml(s.number)}. ${inlineToHtml(
            s.title
          )}</span>${items}</li>`;
        })
        .join("");
      const espBlock = esp
        ? `<div class="lbl" style="margin-top:8px">Objetivos Específicos</div><ol class="obj-esp">${esp}</ol>`
        : "";
      return `<div class="obj-geral tilt"><div class="lbl">Objetivo Geral ${escapeHtml(
        g.number
      )}</div>${g.description ? `<div class="desc">${inlineToHtml(g.description)}</div>` : ""}${espBlock}</div>`;
    })
    .join("");
  return `<h3 class="section-h" id="${objId}">Objetivos de Aprendizagem</h3>${blocks}`;
}

/** Render one content block; heading blocks also get an id (for the TOC). */
function renderBlock(b: ContentBlock, imgs: Map<string, APGImage>, headingId: () => string): string {
  switch (b.kind) {
    case "heading": {
      const id = headingId();
      const cls = `h${b.level}`;
      const num = b.number ? `<span class="num">${escapeHtml(b.number)}</span>` : "";
      return `<div class="${cls}" id="${id}"${alignStyle(b.align)}>${num}${inlineToHtml(b.text)}</div>`;
    }
    case "paragraph":
      return `<p${alignStyle(b.align)}>${inlineToHtml(b.text)}</p>`;
    case "list": {
      const items = b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("");
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag}${alignStyle(b.align)}>${items}</${tag}>`;
    }
    case "divider":
      return `<hr class="rule">`;
    case "image": {
      const im = imgs.get(b.imageId);
      if (!im || !im.dataUrl?.startsWith("data:")) return "";
      const w = b.width ? ` w-${b.width}` : "";
      const cap = b.caption ?? im.caption;
      const align = b.align ?? "center";
      return `<figure class="${w.trim()}"${alignStyle(align)}><img src="${im.dataUrl}" alt="${escapeHtml(
        cap || "Figura"
      )}" loading="lazy">${cap ? `<figcaption>${inlineToHtml(cap)}</figcaption>` : ""}</figure>`;
    }
    case "table": {
      const head = b.header.map((c) => `<th>${inlineToHtml(c)}</th>`).join("");
      const body = b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inlineToHtml(c)}</td>`).join("")}</tr>`)
        .join("");
      const cap = b.title ? `<caption>${inlineToHtml(b.title)}</caption>` : "";
      return `<div class="tbl-wrap"><table>${cap}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }
  }
}

/** Content HTML + the headings (level 0/1) that feed the TOC. */
function renderContent(apg: APG, tocOut: TocEntry[]): string {
  const blocks = parseContent(apg.conteudoRaw);
  const imgs = new Map(apg.images.map((i) => [i.id, i]));
  let n = 0;
  const parts: string[] = [];
  for (const b of blocks) {
    const id = () => `h-${apg.id}-${n++}`;
    // Peek an id for headings so we can add a matching TOC entry.
    if (b.kind === "heading" && (b.level === 0 || b.level === 1)) {
      const hid = `h-${apg.id}-${n}`;
      tocOut.push({ href: hid, text: `${b.number} ${b.text}`.trim(), level: 1 });
    }
    parts.push(renderBlock(b, imgs, id));
  }
  return parts.join("\n");
}

function renderExercises(apg: APG, exId: string): string {
  const list = apg.exercises ?? [];
  if (!list.length) return "";
  const cards = list
    .map((ex, i) => {
      const kind = ex.kind === "objetiva" ? "Objetiva" : "Discursiva";
      const img =
        ex.imageDataUrl && ex.imageDataUrl.startsWith("data:")
          ? `<figure><img src="${ex.imageDataUrl}" alt="${escapeHtml(
              ex.imageCaption || "Figura da questão"
            )}" loading="lazy">${ex.imageCaption ? `<figcaption>${inlineToHtml(ex.imageCaption)}</figcaption>` : ""}</figure>`
          : "";

      let optsHtml = "";
      let akHtml = "";
      if (ex.kind === "objetiva") {
        optsHtml = `<ul class="opts">${ex.options
          .map(
            (o, oi) =>
              `<li class="${oi === ex.correct ? "correct" : ""}"><span class="letter">${String.fromCharCode(
                65 + oi
              )}</span><span>${inlineToHtml(o)}</span></li>`
          )
          .join("")}</ul>`;
        const letter = ex.correct >= 0 ? String.fromCharCode(65 + ex.correct) : "—";
        akHtml =
          `<div class="ak-answer">Resposta correta: letra ${letter}</div>` +
          (ex.explanation ? `<div>${inlineToHtml(ex.explanation)}</div>` : "");
      } else {
        akHtml =
          (ex.answer ? `<div class="ak-answer">Resposta esperada:</div><div>${inlineToHtml(ex.answer)}</div>` : "") +
          (ex.explanation ? `<div style="margin-top:8px">${inlineToHtml(ex.explanation)}</div>` : "");
      }

      const hasKey = !!(ex.explanation || ex.answer || (ex.kind === "objetiva" && ex.correct >= 0));
      const keyBlock = hasKey
        ? `<button class="reveal-btn" type="button">Ver gabarito comentado</button>
           <div class="answer-key"><div class="ak-inner"><div class="ak-lbl">Gabarito comentado</div>${akHtml}</div></div>`
        : "";

      return `<div class="ex tilt reveal-anim" data-qid="${escapeHtml(ex.id)}">
        <div class="ex-head">
          <span class="ex-num">${i + 1}</span>
          <span class="ex-kind">${kind}</span>
          <label class="ex-done-toggle"><input type="checkbox"> respondida</label>
        </div>
        <div class="ex-statement">${inlineToHtml(ex.statement)}</div>
        ${img}${optsHtml}${keyBlock}
      </div>`;
    })
    .join("\n");
  return `<h3 class="section-h" id="${exId}">Questões · Gabarito comentado</h3>${cards}`;
}

function renderApgSection(apg: APG, tocOut: TocEntry[]): string {
  const secId = `apg-${apg.id}`;
  const objId = `obj-${apg.id}`;
  const exId = `ex-${apg.id}`;

  tocOut.push({ href: secId, text: `APG ${apg.numero} — ${apg.titulo || "Sem título"}`, level: "apg" });

  const objectives = renderObjectives(apg, objId);
  if (objectives) tocOut.push({ href: objId, text: "Objetivos", level: 2 });

  const content = renderContent(apg, tocOut);
  const exercises = renderExercises(apg, exId);
  if (exercises) tocOut.push({ href: exId, text: "Questões", level: 2 });

  return `<section class="card apg reveal-anim" id="${secId}">
    <h2 class="apg-title"><span class="badge">APG ${apg.numero}</span> ${inlineToHtml(
      apg.titulo || "Sem título"
    )} <span style="font-size:14px;color:var(--muted);font-weight:400">· ${apg.periodo}º período</span></h2>
    ${objectives}
    ${content ? `<h3 class="section-h">Conteúdo</h3>${content}` : ""}
    ${exercises}
  </section>`;
}

function renderAdCards(): string {
  const cards = AD_PRODUCTS.map((p) => {
    const qr = QR_CODES[p.slug];
    return `<a class="ad tilt reveal-anim" href="${p.ctaUrl}" target="_blank" rel="noopener">
      <div class="kicker">${escapeHtml(p.kicker)}</div>
      <h4>${escapeHtml(p.headline)}</h4>
      <p>${escapeHtml(p.body)}</p>
      <span class="cta">${escapeHtml(p.cta)} →</span>
      <span class="url">${escapeHtml(p.displayUrl)}</span>
      ${qr ? `<img class="qr" src="${qr}" alt="QR ${escapeHtml(p.slug)}">` : ""}
    </a>`;
  }).join("");
  return `<section class="ads reveal-anim"><h2 class="section-h">Continue com a DomineAqui</h2><div class="ads-grid">${cards}</div></section>`;
}

/** A single full-width ad, rotated between APGs (mirrors the PDF's per-APG ad). */
function renderSingleAd(p: AdProduct): string {
  const qr = QR_CODES[p.slug];
  return `<a class="ad-solo tilt reveal-anim" href="${p.ctaUrl}" target="_blank" rel="noopener">
    <div class="ad">
      <div class="kicker">${escapeHtml(p.kicker)}</div>
      <h4>${escapeHtml(p.headline)}</h4>
      <p>${escapeHtml(p.body)}</p>
      <span class="cta">${escapeHtml(p.cta)} →</span>
      <span class="url">${escapeHtml(p.displayUrl)}</span>
      ${qr ? `<img class="qr" src="${qr}" alt="QR ${escapeHtml(p.slug)}">` : ""}
    </div>
  </a>`;
}

/** Short welcome: what this is, who made it, and how to use the experience. */
function renderPreface(): string {
  const steps: [string, string, string][] = [
    ["🧭", "Navegue pelo <b>Sumário</b>", "Use o menu lateral (ou o botão ☰ no celular) para pular direto para qualquer APG, objetivo ou questão."],
    ["🗂️", "Comece pela seção <b>APGs</b>", "Logo abaixo há um índice com todas as APGs — toque em uma para abri-la."],
    ["🔑", "Resolva e confira", "Em cada questão, clique em <b>Ver gabarito comentado</b> para revelar a resposta correta e a explicação."],
    ["✅", "Marque seu progresso", "Ative <b>respondida</b> nas questões que já fez — fica salvo neste dispositivo."],
    ["🌙", "Tema e leitura", "Alterne entre <b>claro e escuro</b> no botão do topo; a barra superior acompanha seu progresso de leitura."],
  ];
  const howto = steps
    .map(
      ([ic, t, d]) =>
        `<div class="step"><div class="ic">${ic}</div><div class="txt"><div>${t}</div><div style="color:var(--muted);font-size:14px">${d}</div></div></div>`
    )
    .join("");
  return `<section class="card preface reveal-anim tilt" id="preface">
    <h2 class="apg-title">Bem-vindo(a) à experiência</h2>
    <p class="lead">Este é um material de estudo <b>interativo</b>: navegável, com objetivos, conteúdo e
    questões com <b>gabarito comentado</b> que você abre quando quiser. Estude no ritmo que preferir,
    no celular, tablet ou computador.</p>
    <div class="creators">
      <div class="lbl">Criado por</div>
      <div class="names">Thiago Rodrigues e João Henrique Lemos</div>
    </div>
    <h3 class="section-h">Como usar</h3>
    <div class="howto">${howto}</div>
  </section>`;
}

/** Visual index of every APG — cards that link to each APG's section. */
function renderApgHub(apgs: APG[]): string {
  const cards = apgs
    .map((a) => {
      const objs = parseObjectives(a.objetivosRaw);
      const nObj = objs.reduce((s, g) => s + g.specifics.length, 0) || objs.length;
      const nEx = (a.exercises ?? []).length;
      const chips = [`${a.periodo}º período`];
      if (nObj) chips.push(`${nObj} objetivo${nObj > 1 ? "s" : ""}`);
      if (nEx) chips.push(`${nEx} quest${nEx > 1 ? "ões" : "ão"}`);
      return `<a class="hub-card tilt" href="#apg-${a.id}">
        <span class="n">APG ${a.numero}</span>
        <h3>${inlineToHtml(a.titulo || "Sem título")}</h3>
        <div class="meta">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div>
        <div class="go">Abrir →</div>
      </a>`;
    })
    .join("");
  return `<section class="card reveal-anim" id="apgs-hub">
    <h2 class="apg-title">APGs</h2>
    <p style="color:var(--muted);margin-top:-6px">Toque em uma APG para começar.</p>
    <div class="hub-grid">${cards}</div>
  </section>`;
}

function renderCover(title: string, subtitle: string, chips: string[]): string {
  const chipHtml = chips.length
    ? `<div class="chips">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div>`
    : "";
  return `<section class="card cover tilt">
    <img src="${LOGO_DATAURL}" alt="${escapeHtml(BRAND.name)}">
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(subtitle)}</div>
    ${chipHtml}
  </section>`;
}

function renderToc(entries: TocEntry[]): string {
  const links = entries
    .map(
      (e) =>
        `<a class="lvl-${e.level}" href="#${e.href}">${escapeHtml(e.text)}</a>`
    )
    .join("");
  return `<aside class="toc" id="toc"><h4>Sumário</h4><nav>${links}</nav></aside>`;
}

function renderFooter(): string {
  return `<footer class="foot">
    ${escapeHtml(BRAND.notice)}<br>
    <a href="https://${BRAND.site}" target="_blank" rel="noopener">${escapeHtml(BRAND.site)}</a>
  </footer>`;
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

interface DocMeta {
  title: string;
  subtitle: string;
  chips: string[];
  materialId: string;
}

function buildDocument(apgs: APG[], theme: ThemeSettings, meta: DocMeta, extras: HtmlExtras): string {
  const withAds = extras.includeAds !== false;
  const toc: TocEntry[] = [];
  // Top-level entries come first so they lead the sidebar, before the APGs.
  toc.push({ href: "preface", text: "Apresentação", level: "apg" });
  if (apgs.length) toc.push({ href: "apgs-hub", text: "APGs", level: "apg" });

  const preface = renderPreface();
  const hub = apgs.length ? renderApgHub(apgs) : "";
  // Each APG section is followed by one rotating ad (mirrors the PDF).
  const sections = apgs
    .map((a, i) => {
      const sec = renderApgSection(a, toc);
      const ad = withAds ? renderSingleAd(AD_PRODUCTS[i % AD_PRODUCTS.length]) : "";
      return sec + ad;
    })
    .join("\n");
  const ads = withAds ? renderAdCards() : "";

  const body = `
  <div class="bg-orbs"><span></span><span></span><span></span></div>
  <div class="progress"><i></i></div>
  <header class="topbar">
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Abrir sumário">☰</button>
    <div class="brand">
      <span class="mark">D</span>
      <div>${escapeHtml(BRAND.name)}<small>${escapeHtml(BRAND.area)} · Material interativo</small></div>
    </div>
    <span class="spacer"></span>
    <button class="icon-btn" id="themeBtn" aria-label="Alternar tema">🌙</button>
  </header>
  <div class="toc-backdrop"></div>
  <div class="layout">
    ${renderToc(toc)}
    <main class="content">
      ${renderCover(meta.title, meta.subtitle, meta.chips)}
      ${preface}
      ${hub}
      ${sections}
      ${ads}
      ${renderFooter()}
    </main>
  </div>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(meta.title)} · ${escapeHtml(BRAND.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>${buildStyles(theme)}</style>
<script>(function(){try{var s=localStorage.getItem('da-theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();</script>
</head>
<body data-material-id="${escapeHtml(meta.materialId)}">
${body}
<script>${RUNTIME_JS}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

const sanitize = (s: string): string =>
  s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "material";

/** Hand an HTML string to the browser as a download or a new tab. */
function deliverHtml(html: string, filename: string, how: "download" | "open"): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  if (how === "open") {
    const win = window.open(url, "_blank");
    if (!win) {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Full interactive notebook with every APG (ordered by period + number). */
export async function downloadHtmlBook(
  apgs: APG[],
  theme: ThemeSettings,
  mode: ExportMode,
  extras: HtmlExtras = {},
  how: "download" | "open" = "download"
): Promise<void> {
  const opt = await optimizeApgs(ordered(apgs), mode);
  const periodos = [...new Set(opt.map((a) => a.periodo))].sort((x, y) => x - y);
  const meta: DocMeta = {
    title: "Caderno de APGs",
    subtitle: `${BRAND.name} · ${BRAND.area}`,
    chips: [`${opt.length} APGs`, ...periodos.map((p) => `${p}º período`)],
    materialId: `book-${shortHash(opt.map((a) => a.id).join(","))}`,
  };
  const html = buildDocument(opt, theme, meta, extras);
  deliverHtml(html, "DomineAqui-Caderno-APGs.html", how);
}

/** Interactive material for a single period. */
export async function downloadHtmlByPeriodo(
  apgs: APG[],
  periodo: number,
  theme: ThemeSettings,
  mode: ExportMode,
  extras: HtmlExtras = {},
  how: "download" | "open" = "download"
): Promise<void> {
  const subset = ordered(apgs).filter((a) => a.periodo === periodo);
  const opt = await optimizeApgs(subset, mode);
  const meta: DocMeta = {
    title: `APGs — ${periodo}º período`,
    subtitle: `${BRAND.name} · ${BRAND.area}`,
    chips: [`${opt.length} APGs`, `${periodo}º período`],
    materialId: `per-${periodo}-${shortHash(opt.map((a) => a.id).join(","))}`,
  };
  const html = buildDocument(opt, theme, meta, extras);
  deliverHtml(html, `DomineAqui-APGs-Periodo-${periodo}.html`, how);
}

/** Interactive material for a single APG. */
export async function downloadHtmlApg(
  apg: APG,
  theme: ThemeSettings,
  mode: ExportMode,
  extras: HtmlExtras = {},
  how: "download" | "open" = "download"
): Promise<void> {
  const [opt] = await optimizeApgs([apg], mode);
  const meta: DocMeta = {
    title: `APG ${apg.numero} — ${apg.titulo || "Sem título"}`,
    subtitle: `${BRAND.name} · ${BRAND.area} · ${apg.periodo}º período`,
    chips: [`${apg.periodo}º período`, `APG ${apg.numero}`],
    materialId: `apg-${apg.id}`,
  };
  const html = buildDocument([opt], theme, meta, extras);
  deliverHtml(html, `DomineAqui-APG-${apg.periodo}-${apg.numero}-${sanitize(apg.titulo)}.html`, how);
}
