// Fullscreen WYSIWYG editor for the APG body, Word/Notion style.
//
// It edits a contentEditable A4 "page" and round-trips with the tag-based
// `conteudoRaw` via ../editor/serialize, so the whole PDF pipeline (clickable
// TOC, automatic numbering, ABNT covers/footers) keeps working unchanged.
// Headings carry no numbers in the DOM — numbering is shown live with CSS
// counters and recomputed identically on serialize.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useToast } from "./Toast";
import { APGImage } from "../state/types";
import { fileToImage, nextImageId } from "../utils/image";
import { htmlToRaw, rawToHtml } from "../editor/serialize";

const SYMBOLS = [
  "→", "←", "↔", "⇒", "⇄", "•", "–", "—",
  "≈", "≠", "≤", "≥", "±", "×", "÷", "·",
  "°", "µ", "α", "β", "γ", "δ", "Δ", "λ",
  "π", "σ", "Ω", "√", "∞", "∴", "↑", "↓",
];

const SIZES = [9, 10, 11, 12, 14, 16, 18, 24];
const FONTS = [
  { key: "Tinos", label: "Tinos (serifa)" },
  { key: "Montserrat", label: "Montserrat (sem serifa)" },
];
const SPACINGS = [
  { v: "1", label: "Simples" },
  { v: "1.15", label: "1,15" },
  { v: "1.5", label: "1,5" },
  { v: "2", label: "Duplo" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  images: APGImage[];
  apgId: string;
  onClose: () => void;
}

interface FmtState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  block: string;
}

export function VisualEditor({ value, onChange, images, apgId, onClose }: Props) {
  const { dispatch } = useApp();
  const notify = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fmt, setFmt] = useState<FmtState>({
    bold: false, italic: false, underline: false, strike: false, ul: false, ol: false, block: "p",
  });
  const [selFig, setSelFig] = useState<HTMLElement | null>(null);

  // ---- load once on mount ----
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = rawToHtml(value, images);
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      /* older engines — non-fatal */
    }
    el.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- serialize back to raw (only on close) ----
  const flush = useCallback(() => {
    const el = editorRef.current;
    if (el) onChange(htmlToRaw(el));
  }, [onChange]);

  const refreshState = useCallback(() => {
    const q = (c: string) => {
      try {
        return document.queryCommandState(c);
      } catch {
        return false;
      }
    };
    let block = "p";
    try {
      block = (document.queryCommandValue("formatBlock") || "p").toLowerCase();
    } catch {
      /* ignore */
    }
    setFmt({
      bold: q("bold"),
      italic: q("italic"),
      underline: q("underline"),
      strike: q("strikeThrough"),
      ul: q("insertUnorderedList"),
      ol: q("insertOrderedList"),
      block,
    });
  }, []);

  useEffect(() => {
    const handler = () => refreshState();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [refreshState]);

  // Keep the editable focused so execCommand targets it.
  const focusEditor = () => editorRef.current?.focus();

  const exec = (cmd: string, val?: string) => {
    focusEditor();
    try {
      document.execCommand(cmd, false, val);
    } catch {
      /* ignore unsupported */
    }
    refreshState();
  };

  /** Wrap the current selection in a styled span (undoable via insertHTML). */
  const wrapStyle = (styleStr: string) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      notify("Selecione um trecho de texto primeiro.", "error");
      return;
    }
    const range = sel.getRangeAt(0);
    const holder = document.createElement("div");
    holder.appendChild(range.cloneContents());
    const html = `<span style="${styleStr}">${holder.innerHTML}</span>`;
    try {
      document.execCommand("insertHTML", false, html);
    } catch {
      /* ignore */
    }
  };

  /** Apply a block-level style (line spacing) to the selection's blocks. */
  const setLineSpacing = (lh: string) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    const root = editorRef.current;
    while (node && node !== root) {
      const el = node as HTMLElement;
      if (el.nodeType === Node.ELEMENT_NODE && /^(P|DIV|H1|H2|H3|LI|UL|OL)$/.test(el.tagName)) {
        el.style.lineHeight = lh;
        break;
      }
      node = node.parentNode;
    }
  };

  // ---- images ----
  const insertHtmlBlock = (html: string) => {
    focusEditor();
    try {
      document.execCommand("insertHTML", false, html + "<p><br></p>");
    } catch {
      /* ignore */
    }
  };

  const figureHtml = (img: APGImage) =>
    `<figure class="ve-image" contenteditable="false" data-img-id="${img.id}" data-align="center" data-width="full">` +
    `<img src="${img.dataUrl}" alt="${img.id}">` +
    (img.caption ? `<figcaption>${img.caption}</figcaption>` : "") +
    `</figure>`;

  const insertImage = (img: APGImage) => insertHtmlBlock(figureHtml(img));

  const uploadFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    let existing = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const id = nextImageId(existing);
        const image = await fileToImage(file, id);
        existing = [...existing, image];
        dispatch({ type: "ADD_IMAGE", id: apgId, image });
        insertImage(image);
      } catch (e) {
        notify((e as Error).message, "error");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      uploadFiles(e.dataTransfer.files);
    }
  };

  // ---- table ----
  const insertTable = () => {
    const cols = Math.max(1, Math.min(8, parseInt(prompt("Número de colunas?", "3") || "3", 10) || 3));
    const rows = Math.max(1, Math.min(30, parseInt(prompt("Número de linhas (incluindo cabeçalho)?", "3") || "3", 10) || 3));
    const head = `<tr>${Array.from({ length: cols }, (_, c) => `<th>Coluna ${c + 1}</th>`).join("")}</tr>`;
    const body = Array.from({ length: rows - 1 }, () =>
      `<tr>${Array.from({ length: cols }, () => "<td>—</td>").join("")}</tr>`
    ).join("");
    insertHtmlBlock(`<table class="ve-table"><caption>Título da tabela</caption>${head}${body}</table>`);
  };

  // ---- figure contextual selection ----
  const onEditorClick = (e: React.MouseEvent) => {
    const fig = (e.target as HTMLElement).closest("figure.ve-image") as HTMLElement | null;
    setSelFig(fig);
  };

  const setFigAttr = (attr: "data-align" | "data-width", val: string) => {
    if (!selFig) return;
    selFig.setAttribute(attr, val);
    setSelFig(selFig); // re-render toolbar state
  };

  const removeFigure = () => {
    if (!selFig) return;
    selFig.remove();
    setSelFig(null);
  };

  // ---- paste sanitization ----
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      const clean = sanitizeHtml(html);
      document.execCommand("insertHTML", false, clean);
    } else {
      document.execCommand("insertText", false, text);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      doClose();
    }
  };

  const doClose = () => {
    flush();
    onClose();
  };

  const Btn = ({
    cmd, val, active, title, children, onClick,
  }: {
    cmd?: string; val?: string; active?: boolean; title: string;
    children: React.ReactNode; onClick?: () => void;
  }) => (
    <button
      type="button"
      className={`vtbtn${active ? " active" : ""}`}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => (onClick ? onClick() : cmd && exec(cmd, val))}
    >
      {children}
    </button>
  );

  return (
    <div className="ve-overlay" role="dialog" aria-label="Editor visual">
      <div className="ve-head">
        <div className="ve-head-title">✦ Editor Visual</div>
        <div className="ve-head-actions">
          <button className="btn btn-ghost" onClick={doClose}>Fechar</button>
          <button className="btn btn-primary" onClick={doClose}>Concluir</button>
        </div>
      </div>

      <div className="ve-toolbar">
        <Btn cmd="bold" active={fmt.bold} title="Negrito (Ctrl+B)"><b>N</b></Btn>
        <Btn cmd="italic" active={fmt.italic} title="Itálico (Ctrl+I)"><i>I</i></Btn>
        <Btn cmd="underline" active={fmt.underline} title="Sublinhado (Ctrl+U)"><u>S</u></Btn>
        <Btn cmd="strikeThrough" active={fmt.strike} title="Tachado"><s>T</s></Btn>

        <span className="vsep" />

        <select
          className="vselect" title="Estilo do bloco" value={fmt.block}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => exec("formatBlock", e.target.value)}
        >
          <option value="p">Parágrafo</option>
          <option value="h1">Título (Parte)</option>
          <option value="h2">Subtítulo (Tópico)</option>
          <option value="h3">Subtópico</option>
        </select>

        <select
          className="vselect" title="Fonte" defaultValue=""
          onChange={(e) => { if (e.target.value) { wrapStyle(`font-family:${fontCss(e.target.value)}`); e.target.value = ""; } }}
        >
          <option value="">Fonte…</option>
          {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>

        <select
          className="vselect" title="Tamanho da fonte" defaultValue=""
          onChange={(e) => { if (e.target.value) { wrapStyle(`font-size:${e.target.value}pt`); e.target.value = ""; } }}
        >
          <option value="">Tam.</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="vtbtn color-btn" title="Cor do texto">
          <span style={{ color: "#1B4332" }}>A</span>
          <input type="color" defaultValue="#1B4332" onChange={(e) => exec("foreColor", e.target.value)} />
        </label>
        <label className="vtbtn color-btn" title="Marca-texto">
          <span style={{ background: "#FFF3A0", padding: "0 2px" }}>H</span>
          <input type="color" defaultValue="#FFF3A0" onChange={(e) => exec("hiliteColor", e.target.value)} />
        </label>

        <span className="vsep" />

        <Btn cmd="justifyLeft" title="Alinhar à esquerda">⯇</Btn>
        <Btn cmd="justifyCenter" title="Centralizar">≡</Btn>
        <Btn cmd="justifyRight" title="Alinhar à direita">⯈</Btn>
        <Btn cmd="justifyFull" title="Justificar">▤</Btn>

        <select
          className="vselect" title="Espaçamento entre linhas" defaultValue=""
          onChange={(e) => { if (e.target.value) { setLineSpacing(e.target.value); e.target.value = ""; } }}
        >
          <option value="">↕ Linhas</option>
          {SPACINGS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>

        <span className="vsep" />

        <Btn cmd="insertUnorderedList" active={fmt.ul} title="Lista com marcadores">•≡</Btn>
        <Btn cmd="insertOrderedList" active={fmt.ol} title="Lista numerada">1≡</Btn>
        <Btn title="Linha divisória" onClick={() => insertHtmlBlock("<hr>")}>―</Btn>

        <span className="vsep" />

        <select
          className="vselect" title="Inserir imagem existente" defaultValue=""
          onChange={(e) => { const img = images.find((i) => i.id === e.target.value); if (img) insertImage(img); e.target.value = ""; }}
        >
          <option value="">🖼 Imagem…</option>
          {images.length === 0 && <option disabled>nenhuma enviada</option>}
          {images.map((i) => <option key={i.id} value={i.id}>{i.id}{i.caption ? ` — ${i.caption}` : ""}</option>)}
        </select>
        <Btn title="Enviar imagem do computador" onClick={() => fileRef.current?.click()}>⤓</Btn>
        <Btn title="Inserir tabela" onClick={insertTable}>▦</Btn>

        <select
          className="vselect" title="Inserir símbolo" defaultValue=""
          onChange={(e) => { if (e.target.value) exec("insertText", e.target.value); e.target.value = ""; }}
        >
          <option value="">Ω</option>
          {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => uploadFiles(e.target.files)} />
      </div>

      <div className="ve-canvas scroll-thin">
        {selFig && (
          <div className="ve-fig-bar">
            <span className="ve-fig-label">Imagem</span>
            <button className="vtbtn" title="Esquerda" onClick={() => setFigAttr("data-align", "left")}>⯇</button>
            <button className="vtbtn" title="Centro" onClick={() => setFigAttr("data-align", "center")}>≡</button>
            <button className="vtbtn" title="Direita" onClick={() => setFigAttr("data-align", "right")}>⯈</button>
            <span className="vsep" />
            <button className="vtbtn" title="Pequena" onClick={() => setFigAttr("data-width", "small")}>S</button>
            <button className="vtbtn" title="Média" onClick={() => setFigAttr("data-width", "medium")}>M</button>
            <button className="vtbtn" title="Total" onClick={() => setFigAttr("data-width", "full")}>L</button>
            <span className="vsep" />
            <button className="vtbtn danger" title="Remover" onClick={removeFigure}>✕</button>
          </div>
        )}
        <div
          ref={editorRef}
          className="ve-page"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onClick={onEditorClick}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}

// CSS font-family value for an embedded family key.
function fontCss(key: string): string {
  if (key === "Montserrat") return "'Montserrat', system-ui, sans-serif";
  if (key === "DejaVuSerif") return "'DejaVu Serif', serif";
  return "'Tinos', 'Times New Roman', serif";
}

// Whitelist-based paste sanitizer: keeps inline formatting we can serialize and
// drops everything else to plain text.
const ALLOWED = new Set([
  "P", "DIV", "BR", "H1", "H2", "H3", "B", "STRONG", "I", "EM", "U", "S", "STRIKE",
  "DEL", "INS", "SPAN", "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "CAPTION",
]);
const KEEP_STYLE = ["color", "background-color", "font-size", "font-family", "text-align", "font-weight", "font-style", "text-decoration", "text-decoration-line"];

function sanitizeHtml(html: string): string {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const walk = (node: Node): string => {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += (child.textContent || "").replace(/[<>]/g, "");
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      const tag = el.tagName;
      if (!ALLOWED.has(tag)) {
        out += walk(el);
        return;
      }
      const styles = KEEP_STYLE
        .map((p) => { const v = el.style.getPropertyValue(p); return v ? `${p}:${v}` : ""; })
        .filter(Boolean)
        .join(";");
      const styleAttr = styles ? ` style="${styles}"` : "";
      out += `<${tag.toLowerCase()}${styleAttr}>${walk(el)}</${tag.toLowerCase()}>`;
    });
    return out;
  };
  return walk(tpl.content) || "";
}
