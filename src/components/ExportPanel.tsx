// Export actions: full consolidated PDF, per-period PDF, and open-in-tab.
// A quality mode controls image downscaling/recompression to keep the PDF light
// and fast to generate. Generation runs async with a busy state so a click
// doesn't appear to freeze the app while pdfmake works.
import React, { useEffect, useState } from "react";
import { useApp } from "../state/store";
import { useToast } from "./Toast";
// The PDF engine carries ~2.7 MB of embedded fonts. Loading it with the page
// made every visit wait for something most sessions never use, so it is pulled
// in only when an export actually runs (and quietly prefetched while idle).
import type { LayoutMode } from "../pdf/generatePdf";
import { ExportMode, MODE_LABEL } from "../utils/optimize";

const pdfLib = () => import("../pdf/generatePdf");
const htmlLib = () => import("../html/generateHtml");

const MODE_KEY = "domineaqui.export.mode";
const LAYOUT_KEY = "domineaqui.export.layout";
const GENEX_KEY = "domineaqui.export.generalExercises";
const TEMAS_KEY = "domineaqui.export.includeTemas";
const MODES: { id: ExportMode; hint: string }[] = [
  { id: "compacto", hint: "Menor e mais rápido. Imagens reduzidas (ideal p/ enviar)." },
  { id: "equilibrado", hint: "Recomendado. Bom equilíbrio entre nitidez e tamanho." },
  { id: "alta", hint: "Imagens em resolução original. Maior e mais lento." },
];
const LAYOUTS: { id: LayoutMode; label: string; hint: string }[] = [
  { id: "single", label: "1 por folha", hint: "Padrão: uma página A4 por folha." },
  {
    id: "duplo",
    label: "2 por folha",
    hint: "Econômico: duas páginas lado a lado por folha A4 (paisagem), com linha de corte — ideal para imprimir apostilas e poupar papel.",
  },
];

export function ExportPanel() {
  const { state, ensureImagesLoaded } = useApp();
  const notify = useToast();
  const { apgs, theme } = state;

  const [mode, setMode] = useState<ExportMode>(() => {
    try {
      const v = localStorage.getItem(MODE_KEY) as ExportMode | null;
      return v && ["compacto", "equilibrado", "alta"].includes(v) ? v : "equilibrado";
    } catch {
      return "equilibrado";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const [layout, setLayout] = useState<LayoutMode>(() => {
    try {
      const v = localStorage.getItem(LAYOUT_KEY) as LayoutMode | null;
      return v === "duplo" ? "duplo" : "single";
    } catch {
      return "single";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {
      /* ignore */
    }
  }, [layout]);

  const [generalEx, setGeneralEx] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GENEX_KEY) === "on";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(GENEX_KEY, generalEx ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [generalEx]);

  const [includeTemas, setIncludeTemas] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TEMAS_KEY) === "on";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(TEMAS_KEY, includeTemas ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [includeTemas]);

  const extras = { generalExercises: generalEx };
  const objExtras = { includeTemas };

  // Warm the export chunk in the background so the first click is instant.
  useEffect(() => {
    const warm = () => {
      pdfLib().catch(() => {});
      htmlLib().catch(() => {});
    };
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, o?: { timeout: number }) => number)
      | undefined;
    const h = ric ? ric(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500);
    return () => {
      if (ric && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(h);
      else window.clearTimeout(h);
    };
  }, []);

  const [busy, setBusy] = useState<string>("");
  const periodos = [...new Set(apgs.map((a) => a.periodo))].sort((x, y) => x - y);
  const disabled = apgs.length === 0 || !!busy;

  // Run an async export with a visible busy state. The 20ms yield lets React
  // paint "Gerando…" before pdfmake's synchronous build briefly blocks the UI.
  //
  // Pictures are downloaded on demand, so an export first makes sure the ones it
  // needs are actually in memory — a PDF with silently missing figures would be
  // worse than a few seconds of waiting.
  const run = async (
    label: string,
    fn: () => Promise<void>,
    done: string,
    needsImages = true
  ) => {
    setBusy(label);
    try {
      await new Promise((r) => setTimeout(r, 20));
      if (needsImages) {
        setBusy("Baixando imagens…");
        await ensureImagesLoaded();
        setBusy(label);
        await new Promise((r) => setTimeout(r, 20));
      }
      await fn();
      notify(done);
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="section-title">Exportar PDF</div>
      <div className="card">
        <div className="hint" style={{ marginTop: 0, marginBottom: 6, fontWeight: 700, color: "var(--green-800)" }}>
          Qualidade do PDF
        </div>
        <div className="mode-row">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`chip ${mode === m.id ? "on" : ""}`}
              disabled={!!busy}
              title={m.hint}
              onClick={() => setMode(m.id)}
            >
              {MODE_LABEL[m.id]}
            </button>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          {MODES.find((m) => m.id === mode)?.hint}
        </div>

        <div className="hint" style={{ marginTop: 12, marginBottom: 6, fontWeight: 700, color: "var(--green-800)" }}>
          Layout da folha
        </div>
        <div className="mode-row">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              className={`chip ${layout === l.id ? "on" : ""}`}
              disabled={!!busy}
              title={l.hint}
              onClick={() => setLayout(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          {LAYOUTS.find((l) => l.id === layout)?.hint}
        </div>

        <label className="genex-toggle">
          <input
            type="checkbox"
            checked={generalEx}
            disabled={!!busy}
            onChange={(e) => setGeneralEx(e.target.checked)}
          />
          <span>
            Adicionar <strong>Lista Geral de Exercícios</strong> no final (todas as questões de
            todas as APGs, no Sumário Geral)
          </span>
        </label>

        <div className="export-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary btn-block"
            disabled={disabled}
            onClick={() =>
              run("Gerando…", async () => (await pdfLib()).generateConsolidated(apgs, theme, mode, layout, extras), "PDF consolidado gerado.")
            }
          >
            {busy ? `⏳ ${busy}` : "⬇ Baixar PDF consolidado"}
          </button>
          <button
            className="btn btn-ghost btn-block"
            disabled={disabled}
            onClick={() =>
              run("Gerando…", async () => (await pdfLib()).openPdf(apgs, theme, mode, layout, extras), "Abrindo PDF em nova aba…")
            }
          >
            ↗ Abrir em nova aba
          </button>
        </div>

        {periodos.length > 0 && (
          <>
            <div className="hint" style={{ marginTop: 12 }}>
              Baixar somente um período:
            </div>
            <div className="period-pills">
              {periodos.map((p) => (
                <button
                  key={p}
                  className="chip"
                  disabled={disabled}
                  onClick={() =>
                    run(
                      "Gerando…",
                      async () => (await pdfLib()).generateByPeriodo(apgs, p, theme, mode, layout, extras),
                      `PDF do período ${p} gerado.`
                    )
                  }
                >
                  Período {p}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 18 }}>
        Resumo de Objetivos
      </div>
      <div className="card">
        <div className="hint" style={{ marginTop: 0 }}>
          PDF enxuto só com os <strong>objetivos de aprendizagem</strong> de cada APG (ótimo para
          estudar/revisar). Marque abaixo para incluir também os <strong>temas</strong> (os tópicos
          do conteúdo).
        </div>

        <label className="genex-toggle">
          <input
            type="checkbox"
            checked={includeTemas}
            disabled={!!busy}
            onChange={(e) => setIncludeTemas(e.target.checked)}
          />
          <span>
            Incluir os <strong>temas</strong> do conteúdo (tópicos de cada APG)
          </span>
        </label>

        <div className="export-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary btn-block"
            disabled={disabled}
            onClick={() =>
              run(
                "Gerando…",
                async () => (await pdfLib()).generateObjectives(apgs, theme, mode, layout, objExtras),
                "Resumo de objetivos gerado.",
                false // objectives-only: no figures involved
              )
            }
          >
            {busy ? `⏳ ${busy}` : "⬇ Baixar resumo (todas as APGs)"}
          </button>
        </div>

        {periodos.length > 0 && (
          <>
            <div className="hint" style={{ marginTop: 12 }}>
              Resumo de somente um período:
            </div>
            <div className="period-pills">
              {periodos.map((p) => (
                <button
                  key={p}
                  className="chip"
                  disabled={disabled}
                  onClick={() =>
                    run(
                      "Gerando…",
                      async () => (await pdfLib()).generateObjectivesByPeriodo(apgs, p, theme, mode, layout, objExtras),
                      `Resumo do período ${p} gerado.`,
                      false // objectives-only: no figures involved
                    )
                  }
                >
                  Período {p}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 18 }}>
        Material interativo (HTML)
      </div>
      <div className="card">
        <div className="hint" style={{ marginTop: 0 }}>
          Baixa um <strong>arquivo .html único</strong> (com tudo embutido) da experiência
          navegável: sumário clicável, objetivos, conteúdo e <strong>questões com gabarito
          comentado que abre ao clicar</strong>. Visual com glassmorphism e animações, modo
          claro/escuro e responsivo. É só subir esse arquivo em qualquer site — ele funciona
          sozinho. A <strong>qualidade</strong> escolhida acima controla o peso das imagens.
        </div>

        <div className="export-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary btn-block"
            disabled={disabled}
            onClick={() =>
              run("Gerando…", async () => (await htmlLib()).downloadHtmlBook(apgs, theme, mode), "Caderno interativo (HTML) gerado.")
            }
          >
            {busy ? `⏳ ${busy}` : "⬇ Baixar caderno (HTML)"}
          </button>
          <button
            className="btn btn-ghost btn-block"
            disabled={disabled}
            onClick={() =>
              run("Gerando…", async () => (await htmlLib()).downloadHtmlBook(apgs, theme, mode, {}, "open"), "Abrindo material em nova aba…")
            }
          >
            ↗ Abrir em nova aba
          </button>
        </div>

        {periodos.length > 0 && (
          <>
            <div className="hint" style={{ marginTop: 12 }}>
              Material de somente um período:
            </div>
            <div className="period-pills">
              {periodos.map((p) => (
                <button
                  key={p}
                  className="chip"
                  disabled={disabled}
                  onClick={() =>
                    run(
                      "Gerando…",
                      async () => (await htmlLib()).downloadHtmlByPeriodo(apgs, p, theme, mode),
                      `Material do período ${p} gerado.`
                    )
                  }
                >
                  Período {p}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
