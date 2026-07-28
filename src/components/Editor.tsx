// Center editor for the selected APG: identification fields, the two pasted
// blocks (objectives + content) and the image manager. Includes inline,
// live parse feedback so the student sees what the PDF will contain.
import React from "react";
import { useApp } from "../state/store";
import { APG } from "../state/types";
import { ImageManager } from "./ImageManager";
import { ExerciseManager } from "./ExerciseManager";
import { ContentField } from "./ContentField";
import { parseObjectives } from "../parser/objectivesParser";
import { parseContent } from "../parser/contentParser";
import { exportSingleApg } from "../utils/backup";
import { downloadHtmlApg } from "../html/generateHtml";
import { ExportMode } from "../utils/optimize";
import { useToast } from "./Toast";

const OBJ_PLACEHOLDER = `Objetivo Geral 1
Compreender a anatomia e a histologia dos pulmões...
Objetivos Específicos
1. Organização anatômica do sistema respiratório inferior
Identificar traqueia, brônquios, bronquíolos e pulmões...
Correlacionar a organização anatômica...
2. Anatomia macroscópica dos pulmões
Identificar pulmão direito e pulmão esquerdo.`;

const CONT_PLACEHOLDER = `PARTE 1 Anatomia do tórax
1.1 Parede torácica
Texto do conteúdo, parágrafos comuns...
1.1.2 Músculos intercostais
Mais texto...
[[img:img1|Vista anterior do tórax]]
PARTE 2 Histologia`;

function field<K extends keyof APG>(
  apg: APG,
  k: K,
  dispatch: ReturnType<typeof useApp>["dispatch"],
  value: APG[K]
) {
  dispatch({ type: "UPDATE_APG", id: apg.id, patch: { [k]: value } as Partial<APG> });
}

export function Editor() {
  const { selected: apg, dispatch, state } = useApp();
  const notify = useToast();

  const exportApgHtml = async (a: APG) => {
    // Respect the quality mode chosen in the Export panel (defaults to equilibrado).
    let mode: ExportMode = "equilibrado";
    try {
      const v = localStorage.getItem("domineaqui.export.mode") as ExportMode | null;
      if (v && ["compacto", "equilibrado", "alta"].includes(v)) mode = v;
    } catch {
      /* ignore */
    }
    try {
      await downloadHtmlApg(a, state.theme, mode);
      notify("Material interativo (HTML) gerado.");
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  if (!apg) {
    return (
      <main className="panel editor">
        <div className="empty-editor">
          <div>
            <h2 style={{ color: "var(--green-700)" }}>Comece criando uma APG</h2>
            <p>Use o botão “+ Nova APG” na barra lateral.</p>
          </div>
        </div>
      </main>
    );
  }

  const objStats = parseObjectives(apg.objetivosRaw);
  const contentBlocks = parseContent(apg.conteudoRaw);
  const headings = contentBlocks.filter((b) => b.kind === "heading").length;
  const imgsUsed = contentBlocks.filter((b) => b.kind === "image").length;

  return (
    <main className="panel editor scroll-thin">
      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Identificação
        </div>
        <div className="row">
          <label className="field">
            <span>Período</span>
            <input
              type="number"
              min={1}
              value={apg.periodo}
              onChange={(e) =>
                field(apg, "periodo", dispatch, Math.max(1, Number(e.target.value) || 1))
              }
            />
          </label>
          <label className="field">
            <span>Número da APG</span>
            <input
              type="number"
              min={1}
              value={apg.numero}
              onChange={(e) =>
                field(apg, "numero", dispatch, Math.max(1, Number(e.target.value) || 1))
              }
            />
          </label>
          <label className="field field-action">
            <span>&nbsp;</span>
            <button
              className="btn btn-ghost btn-block"
              title="Exportar somente esta APG para um arquivo"
              onClick={() => exportSingleApg(apg, state.theme)}
            >
              ⬆ Exportar esta APG
            </button>
          </label>
          <label className="field field-action">
            <span>&nbsp;</span>
            <button
              className="btn btn-ghost btn-block"
              title="Baixar esta APG como material interativo (HTML)"
              onClick={() => exportApgHtml(apg)}
            >
              ⬇ Baixar este APG (HTML)
            </button>
          </label>
          <label className="field field-action">
            <span>&nbsp;</span>
            <button
              className="btn btn-danger btn-block"
              onClick={() => {
                if (confirm("Excluir esta APG?"))
                  dispatch({ type: "DELETE_APG", id: apg.id });
              }}
            >
              Excluir APG
            </button>
          </label>
        </div>
        <label className="field">
          <span>Título da APG</span>
          <input
            type="text"
            placeholder="Ex.: Sistema Respiratório — Ventilação Pulmonar"
            value={apg.titulo}
            onChange={(e) => field(apg, "titulo", dispatch, e.target.value)}
          />
        </label>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Objetivos (colar bloco completo)
          <span style={{ float: "right", fontWeight: 700, color: "var(--green-500)" }}>
            {objStats.length} ger. ·{" "}
            {objStats.reduce((n, g) => n + g.specifics.length, 0)} esp.
          </span>
        </div>
        <textarea
          rows={10}
          placeholder={OBJ_PLACEHOLDER}
          value={apg.objetivosRaw}
          onChange={(e) => field(apg, "objetivosRaw", dispatch, e.target.value)}
        />
        <p className="hint">
          O parser reconhece <code>Objetivo Geral N</code>,{" "}
          <code>Objetivos Específicos</code> e itens numerados <code>1.</code> — não é
          preciso formatar manualmente.
        </p>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Conteúdo (colar corpo do texto)
          <span style={{ float: "right", fontWeight: 700, color: "var(--green-500)" }}>
            {headings} tópicos · {imgsUsed} imagens
          </span>
        </div>
        <ContentField
          value={apg.conteudoRaw}
          images={apg.images}
          apgId={apg.id}
          placeholder={CONT_PLACEHOLDER}
          onChange={(v) => field(apg, "conteudoRaw", dispatch, v)}
        />
        <p className="hint">
          Hierarquia do sumário: <code>PARTE N</code> (nível 1), <code>N.N</code> (nível
          2), <code>N.N.N</code> (nível 3). Formate selecionando o texto e usando a
          barra acima (negrito, cor, marca-texto). Imagens: <code>[[img:id]]</code>.
          Tabelas: <code>[tabela]…[/tabela]</code> com células separadas por{" "}
          <code>|</code>; ou, para tabela colada "achatada" do chat,{" "}
          <code>[tabela:N]…[/tabela]</code> com <code>N</code> = nº de colunas.
        </p>
      </div>

      <ImageManager apg={apg} />

      <ExerciseManager apg={apg} />
    </main>
  );
}
