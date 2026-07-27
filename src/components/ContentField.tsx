// A Word/Canva-style editing surface for the APG body: a formatting toolbar
// that wraps the current selection in inline tags ([b], [i], [u], color,
// highlight), plus quick inserts for images, tables, headings and symbols.
// The underlying value stays plain text (with tags), which the PDF rich-text
// engine renders — so everything round-trips and persists safely.
import React, { useEffect, useRef, useState } from "react";
import { APGImage } from "../state/types";
import { VisualEditor } from "./VisualEditor";

const SYMBOLS = [
  "→", "←", "↔", "⇒", "⇄", "•", "–", "—",
  "≈", "≠", "≤", "≥", "±", "×", "÷", "·",
  "°", "µ", "α", "β", "γ", "δ", "Δ", "λ",
  "π", "σ", "Ω", "√", "∞", "∴", "↑", "↓",
];

const TABLE_TEMPLATE = `[tabela] Título da tabela
Coluna A | Coluna B | Coluna C
Linha 1A | Linha 1B | Linha 1C
Linha 2A | Linha 2B | Linha 2C
[/tabela]`;

// For tables copied "flat" from the chat (no separators): wrap with [tabela:N],
// N = número de colunas. O texto colado fica na linha de dentro.
const TABLE_FLAT_TEMPLATE = `[tabela:2] Título da tabela
COLE-AQUI-O-TEXTO-ACHATADO-DA-TABELA
[/tabela]`;

interface Props {
  value: string;
  onChange: (v: string) => void;
  images: APGImage[];
  apgId: string;
  placeholder?: string;
}

export function ContentField({ value, onChange, images, apgId, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [visual, setVisual] = useState(false);

  // Last caret/selection in the textarea. Tracked continuously so a toolbar
  // action (image/symbol dropdown, color swatch) inserts where the user was —
  // those controls blur the textarea, which otherwise collapses the caret to
  // the end and dropped the image at the bottom.
  const selRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const rememberSel = () => {
    const ta = ref.current;
    if (ta) selRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  };

  // Local copy decouples keystrokes from the global store so that pdfmake
  // (inside Preview) doesn't regenerate on every character. The store (and
  // therefore the live preview) only updates after 1 s of idle typing.
  const [localValue, setLocalValue] = useState(value);
  const localRef = useRef(value);       // always holds latest local value
  const debounceTimer = useRef<number>();
  const isDirty = useRef(false);        // true while debounce is pending
  const onChangeRef = useRef(onChange); // always up-to-date
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Sync from the store when it changes externally (APG switch or visual editor
  // save) — but never overwrite a pending local edit.
  useEffect(() => {
    if (!isDirty.current) {
      localRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  const commitToStore = (v: string) => {
    isDirty.current = false;
    onChangeRef.current(v);
  };

  const handleChange = (v: string) => {
    localRef.current = v;
    setLocalValue(v);
    isDirty.current = true;
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => commitToStore(localRef.current), 1000);
  };

  /** Flush any pending debounce immediately (called before opening the visual editor). */
  const flushNow = () => {
    if (isDirty.current) {
      window.clearTimeout(debounceTimer.current);
      commitToStore(localRef.current);
    }
  };

  /** Replace the current selection, optionally wrapping it. */
  const surround = (before: string, after = "") => {
    const ta = ref.current;
    if (!ta) return;
    // Prefer the live caret if the textarea is focused; otherwise the last
    // remembered position (toolbar controls blur the textarea).
    const focused = document.activeElement === ta;
    const cur = localRef.current;
    const s = Math.min(focused ? ta.selectionStart : selRef.current.start, cur.length);
    const e = Math.min(focused ? ta.selectionEnd : selRef.current.end, cur.length);
    const sel = cur.slice(s, e);
    const next = cur.slice(0, s) + before + sel + after + cur.slice(e);
    const caret = sel ? s + before.length + sel.length + after.length : s + before.length;
    selRef.current = { start: caret, end: caret };
    handleChange(next);
    // Restore focus + place caret after the inserted content.
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  const insert = (text: string) => surround(text, "");

  const insertBlock = (text: string) => {
    const ta = ref.current;
    if (!ta) return;
    const focused = document.activeElement === ta;
    const s = Math.min(focused ? ta.selectionStart : selRef.current.start, localRef.current.length);
    const needNl = s > 0 && localRef.current[s - 1] !== "\n";
    surround((needNl ? "\n" : "") + text + "\n");
  };

  const color = useRef<HTMLInputElement>(null);
  const highlight = useRef<HTMLInputElement>(null);

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="tbtn" title="Negrito" onClick={() => surround("[b]", "[/b]")}>
          <b>N</b>
        </button>
        <button type="button" className="tbtn" title="Itálico" onClick={() => surround("[i]", "[/i]")}>
          <i>I</i>
        </button>
        <button type="button" className="tbtn" title="Sublinhado" onClick={() => surround("[u]", "[/u]")}>
          <u>S</u>
        </button>

        <span className="tsep" />

        <label className="tbtn color-btn" title="Cor do texto">
          <span style={{ color: "#1B4332" }}>A</span>
          <input
            ref={color}
            type="color"
            defaultValue="#1B4332"
            onChange={(ev) => surround(`[c=${ev.target.value}]`, "[/c]")}
          />
        </label>
        <label className="tbtn color-btn" title="Marca-texto">
          <span style={{ background: "#FFF3A0", padding: "0 2px" }}>H</span>
          <input
            ref={highlight}
            type="color"
            defaultValue="#FFF3A0"
            onChange={(ev) => surround(`[h=${ev.target.value}]`, "[/h]")}
          />
        </label>

        <span className="tsep" />

        <button type="button" className="tbtn" title="Inserir PARTE" onClick={() => insertBlock("PARTE 1 Título da parte")}>
          P
        </button>
        <button type="button" className="tbtn" title="Subtópico 1.1" onClick={() => insertBlock("1.1 Subtópico")}>
          1.1
        </button>
        <button type="button" className="tbtn" title="Inserir tabela (com |)" onClick={() => insertBlock(TABLE_TEMPLATE)}>
          ▦
        </button>
        <button
          type="button"
          className="tbtn"
          title="Inserir tabela achatada (colada do chat) — defina o nº de colunas em [tabela:N]"
          onClick={() => insertBlock(TABLE_FLAT_TEMPLATE)}
        >
          ▦⁺
        </button>

        <span className="tsep" />

        <select
          className="tselect"
          title="Inserir imagem"
          value=""
          onChange={(ev) => {
            if (ev.target.value) insert(`\n[[img:${ev.target.value}]]\n`);
            ev.target.value = "";
          }}
        >
          <option value="">🖼 Imagem…</option>
          {images.length === 0 && <option disabled>envie imagens abaixo</option>}
          {images.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id}
              {i.caption ? ` — ${i.caption}` : ""}
            </option>
          ))}
        </select>

        <select
          className="tselect"
          title="Inserir símbolo"
          value=""
          onChange={(ev) => {
            if (ev.target.value) insert(ev.target.value);
            ev.target.value = "";
          }}
        >
          <option value="">Ω Símbolo…</option>
          {SYMBOLS.map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ve-launch"
          title="Abrir editor visual em tela cheia (Word/Canva)"
          onClick={() => { flushNow(); setVisual(true); }}
        >
          ✦ Editor Visual
        </button>
      </div>

      <textarea
        ref={ref}
        rows={16}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => {
          handleChange(e.target.value);
          rememberSel();
        }}
        onSelect={rememberSel}
        onKeyUp={rememberSel}
        onMouseUp={rememberSel}
        onBlur={rememberSel}
      />

      {visual && (
        <VisualEditor
          value={value}
          onChange={onChange}
          images={images}
          apgId={apgId}
          onClose={() => setVisual(false)}
        />
      )}
    </div>
  );
}
