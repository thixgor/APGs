// Left sidebar: APGs grouped into collapsible folders by period (less visual
// clutter), plus creation, backup/share, PDF export and the theme panel.
import React, { useEffect, useState } from "react";
import { useApp } from "../state/store";
import { ThemePanel } from "./ThemePanel";
import { ExportPanel } from "./ExportPanel";
import { BackupPanel } from "./BackupPanel";

const EXPANDED_KEY = "domineaqui.sidebar.expanded";

export function Sidebar() {
  const { state, dispatch } = useApp();
  const { apgs, selectedId } = state;
  const selectedPeriodo = apgs.find((a) => a.id === selectedId)?.periodo;

  const periods = [...new Set(apgs.map((a) => a.periodo))].sort((a, b) => a - b);

  const [expanded, setExpanded] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_KEY);
      if (raw) return new Set<number>(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return new Set<number>(selectedPeriodo != null ? [selectedPeriodo] : periods.slice(0, 1));
  });

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  // Always keep the selected APG's period open so it's visible after select/create.
  useEffect(() => {
    if (selectedPeriodo == null) return;
    setExpanded((prev) => (prev.has(selectedPeriodo) ? prev : new Set(prev).add(selectedPeriodo)));
  }, [selectedPeriodo]);

  const toggle = (p: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  return (
    <aside className="panel sidebar scroll-thin">
      <div className="section-title">APGs cadastradas</div>

      {apgs.length === 0 && (
        <p className="hint">Nenhuma APG ainda. Crie a primeira para começar.</p>
      )}

      {periods.map((p) => {
        const items = apgs.filter((a) => a.periodo === p).sort((a, b) => a.numero - b.numero);
        const open = expanded.has(p);
        return (
          <div key={p} className="period-folder">
            <button
              className={`folder-head ${open ? "open" : ""}`}
              onClick={() => toggle(p)}
              title={open ? "Recolher" : "Expandir"}
            >
              <span className="chev">{open ? "▾" : "▸"}</span>
              <span className="folder-name">Período {p}</span>
              <span className="folder-count">{items.length}</span>
            </button>

            {open && (
              <div className="folder-body">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className={`apg-item ${a.id === selectedId ? "active" : ""}`}
                    onClick={() => dispatch({ type: "SELECT_APG", id: a.id })}
                  >
                    <span className="badge">APG {a.numero}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="title">{a.titulo || "Sem título"}</div>
                      <div className="mini">
                        {a.images.length} img · {a.exercises?.length ?? 0} quest. ·{" "}
                        {a.conteudoRaw.trim() ? "com conteúdo" : "vazia"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 8 }}
        onClick={() => dispatch({ type: "ADD_APG" })}
      >
        + Nova APG
      </button>

      <BackupPanel />
      <ExportPanel />
      <ThemePanel />
    </aside>
  );
}
