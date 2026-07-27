// Exercise list manager for the selected APG. Lets the student build a fully
// modular question bank (objetiva A/B/C/D… or discursiva), each with an
// optional image (upload or URL) and a commented answer. Supports import/export
// in a human-friendly plain-text format and bulk operations (select all,
// duplicate, delete all/selected).
//
// Edits are kept in a local draft and committed to the store debounced, so the
// live PDF preview doesn't rebuild on every keystroke.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useToast } from "./Toast";
import { APG, Exercise, ExerciseKind } from "../state/types";
import {
  blankExercise,
  exercisesToMarkdown,
  genExerciseId,
  letterFor,
  parseExercises,
} from "../parser/exerciseParser";
import { fileToDataUrl, urlToDataUrl } from "../utils/image";

const IMPORT_PLACEHOLDER = `# Lista de Exercícios

1. Qual a principal função das hemácias?
img: https://exemplo.com/hemacia.png | Hemácia em corte
A) Coagulação sanguínea
B) Transporte de oxigênio
C) Defesa imunológica
D) Produção de hormônios
Gabarito: B
Comentário: As hemácias contêm hemoglobina, que transporta O₂.

2. Explique o mecanismo da ventilação pulmonar.
Gabarito: Contração do diafragma e intercostais externos reduz a pressão...
Comentário: Avaliar se o aluno cita a Lei de Boyle.`;

export function ExerciseManager({ apg }: { apg: APG }) {
  const { dispatch } = useApp();
  const notify = useToast();

  // Local working copy → debounced commit (keeps the preview snappy).
  const [draft, setDraft] = useState<Exercise[]>(apg.exercises);
  const draftRef = useRef(draft);
  const timer = useRef<number>();
  const dirty = useRef(false);
  const apgIdRef = useRef(apg.id);

  const commitNow = useCallback(
    (list: Exercise[]) => {
      dirty.current = false;
      dispatch({ type: "UPDATE_APG", id: apgIdRef.current, patch: { exercises: list } });
    },
    [dispatch]
  );

  // Apply a change locally; structural changes commit immediately, text edits
  // debounce so rapid typing doesn't churn the PDF preview.
  const apply = useCallback(
    (list: Exercise[], immediate = false) => {
      draftRef.current = list;
      setDraft(list);
      dirty.current = true;
      window.clearTimeout(timer.current);
      if (immediate) {
        commitNow(list);
      } else {
        timer.current = window.setTimeout(() => commitNow(draftRef.current), 600);
      }
    },
    [commitNow]
  );

  // Re-sync when the selected APG changes (flush any pending edit first).
  useEffect(() => {
    if (apg.id !== apgIdRef.current) {
      if (dirty.current) {
        window.clearTimeout(timer.current);
        commitNow(draftRef.current);
      }
      apgIdRef.current = apg.id;
      draftRef.current = apg.exercises;
      setDraft(apg.exercises);
      setSelected(new Set());
    }
  }, [apg.id, apg.exercises, commitNow]);

  // Flush on unmount.
  useEffect(() => {
    return () => {
      if (dirty.current) {
        window.clearTimeout(timer.current);
        commitNow(draftRef.current);
      }
    };
  }, [commitNow]);

  // ---- selection + UI state ----
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  // ---- per-exercise mutation ----
  const patchEx = (id: string, patch: Partial<Exercise>, immediate = false) => {
    apply(draft.map((e) => (e.id === id ? { ...e, ...patch } : e)), immediate);
  };

  const addExercise = (kind: ExerciseKind) => {
    const ex = blankExercise(kind);
    apply([...draft, ex], true);
    setExpanded(new Set([...expanded, ex.id]));
  };

  const duplicateOne = (id: string) => {
    const idx = draft.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const copy: Exercise = { ...draft[idx], id: genExerciseId() };
    const next = [...draft.slice(0, idx + 1), copy, ...draft.slice(idx + 1)];
    apply(next, true);
  };

  const deleteOne = (id: string) => {
    apply(draft.filter((e) => e.id !== id), true);
    const s = new Set(selected); s.delete(id); setSelected(s);
  };

  const moveOne = (id: string, dir: -1 | 1) => {
    const idx = draft.findIndex((e) => e.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[idx], next[j]] = [next[j], next[idx]];
    apply(next, true);
  };

  // ---- bulk ops ----
  const allSelected = draft.length > 0 && selected.size === draft.length;
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(draft.map((e) => e.id)));
  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} questão(ões) selecionada(s)?`)) return;
    apply(draft.filter((e) => !selected.has(e.id)), true);
    setSelected(new Set());
  };
  const duplicateSelected = () => {
    if (selected.size === 0) return;
    const next: Exercise[] = [];
    draft.forEach((e) => {
      next.push(e);
      if (selected.has(e.id)) next.push({ ...e, id: genExerciseId() });
    });
    apply(next, true);
  };
  const deleteAll = () => {
    if (draft.length === 0) return;
    if (!confirm("Excluir TODAS as questões desta APG?")) return;
    apply([], true);
    setSelected(new Set());
  };

  // ---- option editing (objetiva) ----
  const setOption = (id: string, oi: number, text: string) => {
    const ex = draft.find((e) => e.id === id);
    if (!ex) return;
    const options = ex.options.map((o, i) => (i === oi ? text : o));
    patchEx(id, { options });
  };
  const addOption = (id: string) => {
    const ex = draft.find((e) => e.id === id);
    if (!ex || ex.options.length >= 8) return;
    patchEx(id, { options: [...ex.options, ""] }, true);
  };
  const removeOption = (id: string, oi: number) => {
    const ex = draft.find((e) => e.id === id);
    if (!ex) return;
    const options = ex.options.filter((_, i) => i !== oi);
    let correct = ex.correct;
    if (correct === oi) correct = -1;
    else if (correct > oi) correct -= 1;
    patchEx(id, { options, correct }, true);
  };

  // ---- images ----
  const onUpload = async (id: string, file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      patchEx(id, { imageDataUrl: dataUrl, imageUrl: undefined }, true);
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };
  const onUrlBlur = async (id: string, url: string) => {
    const clean = url.trim();
    patchEx(id, { imageUrl: clean || undefined }, true);
    if (!clean) {
      patchEx(id, { imageDataUrl: undefined }, true);
      return;
    }
    try {
      const dataUrl = await urlToDataUrl(clean);
      patchEx(id, { imageDataUrl: dataUrl, imageUrl: clean }, true);
      notify("Imagem da URL baixada e embutida.");
    } catch (e) {
      patchEx(id, { imageDataUrl: undefined }, true);
      notify(`URL salva, mas a imagem não pôde ser embutida: ${(e as Error).message}`, "error");
    }
  };
  const clearImage = (id: string) =>
    patchEx(id, { imageDataUrl: undefined, imageUrl: undefined, imageCaption: undefined }, true);

  // ---- import / export ----
  const doImport = (mode: "append" | "replace") => {
    const parsed = parseExercises(importText);
    if (parsed.length === 0) {
      notify("Nenhuma questão reconhecida no texto.", "error");
      return;
    }
    const next = mode === "replace" ? parsed : [...draft, ...parsed];
    apply(next, true);
    // Resolve any image URLs to embedded data URLs in the background.
    resolveImportImages(parsed);
    setImportText("");
    setShowImport(false);
    notify(`${parsed.length} questão(ões) importada(s).`);
  };

  // Fetch+embed images referenced by URL after an import (best effort).
  const resolveImportImages = async (imported: Exercise[]) => {
    for (const ex of imported) {
      if (ex.imageUrl && !ex.imageDataUrl) {
        try {
          const dataUrl = await urlToDataUrl(ex.imageUrl);
          // patch by id against the latest draft
          apply(
            draftRef.current.map((e) => (e.id === ex.id ? { ...e, imageDataUrl: dataUrl } : e)),
            true
          );
        } catch {
          /* leave URL only — noted in PDF as not embedded */
        }
      }
    }
  };

  const doExport = () => {
    const md = exercisesToMarkdown(draft);
    navigator.clipboard?.writeText(md).then(
      () => notify("Lista de exercícios copiada (texto)."),
      () => {
        setImportText(md);
        setShowImport(true);
        notify("Copie o texto manualmente do campo acima.", "error");
      }
    );
  };

  // ---------------------------------------------------------------------------

  return (
    <div className="card">
      <div className="section-title" style={{ marginTop: 0 }}>
        Lista de Exercícios
        <span style={{ float: "right", fontWeight: 700, color: "var(--green-500)" }}>
          {draft.length} questõe(s)
        </span>
      </div>

      <div className="ex-addbar">
        <button className="btn btn-primary btn-xs" onClick={() => addExercise("objetiva")}>
          + Objetiva (A,B,C,D)
        </button>
        <button className="btn btn-accent btn-xs" onClick={() => addExercise("discursiva")}>
          + Discursiva
        </button>
        <button className="btn btn-ghost btn-xs" onClick={() => setShowImport((s) => !s)}>
          ⇪ Importar / Exportar
        </button>
      </div>

      {showImport && (
        <div className="ex-importer">
          <textarea
            rows={9}
            placeholder={IMPORT_PLACEHOLDER}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="ex-importer-actions">
            <button className="btn btn-primary btn-xs" onClick={() => doImport("append")}>
              Importar (adicionar)
            </button>
            <button className="btn btn-ghost btn-xs" onClick={() => doImport("replace")}>
              Importar (substituir)
            </button>
            <button className="btn btn-ghost btn-xs" onClick={doExport}>
              Exportar atuais (copiar)
            </button>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            Formato: <code>1.</code> enunciado · <code>A)</code> alternativas ·{" "}
            <code>Gabarito: B</code> · <code>Comentário: …</code> · imagem{" "}
            <code>img: URL | legenda</code>. Sem alternativas = discursiva.
          </p>
        </div>
      )}

      {draft.length > 0 && (
        <div className="ex-bulkbar">
          <label className="ex-checkall">
            <input type="checkbox" checked={allSelected} onChange={selectAll} />
            {allSelected ? "Desmarcar todas" : "Selecionar todas"}
          </label>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-xs" disabled={selected.size === 0} onClick={duplicateSelected}>
            Duplicar ({selected.size})
          </button>
          <button className="btn btn-danger btn-xs" disabled={selected.size === 0} onClick={deleteSelected}>
            Excluir sel.
          </button>
          <button className="btn btn-danger btn-xs" onClick={deleteAll}>
            Excluir todas
          </button>
        </div>
      )}

      <div className="ex-list">
        {draft.map((ex, i) => (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            index={i}
            total={draft.length}
            selected={selected.has(ex.id)}
            expanded={expanded.has(ex.id)}
            onToggleSel={() => toggleSel(ex.id)}
            onToggleExpand={() => toggleExpand(ex.id)}
            onPatch={(patch, immediate) => patchEx(ex.id, patch, immediate)}
            onSetOption={(oi, text) => setOption(ex.id, oi, text)}
            onAddOption={() => addOption(ex.id)}
            onRemoveOption={(oi) => removeOption(ex.id, oi)}
            onUpload={(file) => onUpload(ex.id, file)}
            onUrlBlur={(url) => onUrlBlur(ex.id, url)}
            onClearImage={() => clearImage(ex.id)}
            onDuplicate={() => duplicateOne(ex.id)}
            onDelete={() => deleteOne(ex.id)}
            onMove={(dir) => moveOne(ex.id, dir)}
          />
        ))}
      </div>

      {draft.length === 0 && (
        <p className="hint">
          Nenhuma questão ainda. Crie uma objetiva/discursiva ou importe pelo texto.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single exercise row
// ---------------------------------------------------------------------------

interface RowProps {
  ex: Exercise;
  index: number;
  total: number;
  selected: boolean;
  expanded: boolean;
  onToggleSel: () => void;
  onToggleExpand: () => void;
  onPatch: (patch: Partial<Exercise>, immediate?: boolean) => void;
  onSetOption: (oi: number, text: string) => void;
  onAddOption: () => void;
  onRemoveOption: (oi: number) => void;
  onUpload: (file: File | undefined) => void;
  onUrlBlur: (url: string) => void;
  onClearImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

function ExerciseRow(p: RowProps) {
  const { ex, index, total } = p;
  const fileRef = useRef<HTMLInputElement>(null);
  const preview =
    ex.statement.replace(/\[[^\]]*\]/g, "").trim().slice(0, 70) || "(sem enunciado)";

  return (
    <div className={`ex-item ${p.selected ? "sel" : ""}`}>
      <div className="ex-head">
        <input type="checkbox" checked={p.selected} onChange={p.onToggleSel} />
        <span className={`ex-badge ${ex.kind}`}>
          {index + 1} · {ex.kind === "objetiva" ? "Obj" : "Disc"}
        </span>
        <span className="ex-preview" onClick={p.onToggleExpand} title="Editar">
          {preview}
        </span>
        <div className="ex-actions">
          <button className="btn btn-ghost btn-xs" title="Subir" disabled={index === 0} onClick={() => p.onMove(-1)}>▲</button>
          <button className="btn btn-ghost btn-xs" title="Descer" disabled={index === total - 1} onClick={() => p.onMove(1)}>▼</button>
          <button className="btn btn-ghost btn-xs" title="Duplicar" onClick={p.onDuplicate}>⧉</button>
          <button className="btn btn-ghost btn-xs" title={p.expanded ? "Recolher" : "Editar"} onClick={p.onToggleExpand}>
            {p.expanded ? "▾" : "✎"}
          </button>
          <button className="btn btn-danger btn-xs" title="Excluir" onClick={p.onDelete}>✕</button>
        </div>
      </div>

      {p.expanded && (
        <div className="ex-body">
          <div className="ex-kind-toggle">
            <button
              className={`chip ${ex.kind === "objetiva" ? "on" : ""}`}
              onClick={() =>
                p.onPatch(
                  { kind: "objetiva", options: ex.options.length ? ex.options : ["", "", "", ""] },
                  true
                )
              }
            >
              Objetiva
            </button>
            <button
              className={`chip ${ex.kind === "discursiva" ? "on" : ""}`}
              onClick={() => p.onPatch({ kind: "discursiva" }, true)}
            >
              Discursiva
            </button>
          </div>

          <label className="field">
            <span>Enunciado</span>
            <textarea
              rows={3}
              value={ex.statement}
              placeholder="Texto da questão (aceita [b], [c=#hex], etc.)"
              onChange={(e) => p.onPatch({ statement: e.target.value })}
            />
          </label>

          {/* image */}
          <div className="ex-image-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { p.onUpload(e.target.files?.[0]); if (fileRef.current) fileRef.current.value = ""; }}
            />
            <button className="btn btn-ghost btn-xs" onClick={() => fileRef.current?.click()}>⤓ Enviar imagem</button>
            <input
              type="text"
              className="ex-url"
              placeholder="ou cole a URL da imagem"
              defaultValue={ex.imageUrl ?? ""}
              onBlur={(e) => p.onUrlBlur(e.target.value)}
            />
            {(ex.imageDataUrl || ex.imageUrl) && (
              <button className="btn btn-danger btn-xs" onClick={p.onClearImage}>Remover img</button>
            )}
          </div>
          {(ex.imageDataUrl || ex.imageUrl) && (
            <div className="ex-image-preview">
              {ex.imageDataUrl ? (
                <img src={ex.imageDataUrl} alt="" />
              ) : (
                <span className="ex-img-warn">URL salva, mas não embutida (não aparece no PDF).</span>
              )}
              <input
                type="text"
                placeholder="Legenda da imagem (opcional)"
                value={ex.imageCaption ?? ""}
                onChange={(e) => p.onPatch({ imageCaption: e.target.value })}
              />
            </div>
          )}

          {/* options (objetiva) */}
          {ex.kind === "objetiva" && (
            <div className="ex-options">
              <span className="ex-sublabel">Alternativas (marque a correta)</span>
              {ex.options.map((opt, oi) => (
                <div key={oi} className="ex-opt">
                  <label className="ex-opt-radio" title="Correta">
                    <input
                      type="radio"
                      name={`correct-${ex.id}`}
                      checked={ex.correct === oi}
                      onChange={() => p.onPatch({ correct: oi }, true)}
                    />
                    <b>{letterFor(oi)}</b>
                  </label>
                  <input
                    type="text"
                    value={opt}
                    placeholder={`Alternativa ${letterFor(oi)}`}
                    onChange={(e) => p.onSetOption(oi, e.target.value)}
                  />
                  <button className="btn btn-danger btn-xs" title="Remover alternativa" onClick={() => p.onRemoveOption(oi)}>✕</button>
                </div>
              ))}
              {ex.options.length < 8 && (
                <button className="btn btn-ghost btn-xs" onClick={p.onAddOption}>+ Alternativa</button>
              )}
            </div>
          )}

          {/* discursive model answer */}
          {ex.kind === "discursiva" && (
            <label className="field">
              <span>Gabarito (resposta esperada)</span>
              <textarea
                rows={2}
                value={ex.answer}
                placeholder="Resposta modelo esperada"
                onChange={(e) => p.onPatch({ answer: e.target.value })}
              />
            </label>
          )}

          <label className="field" style={{ marginBottom: 0 }}>
            <span>Resposta comentada</span>
            <textarea
              rows={2}
              value={ex.explanation}
              placeholder="Explicação que aparece no gabarito comentado"
              onChange={(e) => p.onPatch({ explanation: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
