// Conflict resolution for importing APGs. When an incoming APG has the same
// Período + Número as one already in the app, the user chooses per conflict:
//   substituir (overwrite) · manter a atual (skip) · manter ambas (add copy).
// Non-conflicting APGs are always added.
import React, { useMemo, useState } from "react";
import { APG } from "../state/types";
import { importApg } from "../state/store";

type Choice = "replace" | "keep-current" | "keep-both";

interface Conflict {
  raw: unknown;
  periodo: number;
  numero: number;
  incomingTitle: string;
  currentTitle: string;
}

interface Props {
  incoming: unknown[];
  existing: APG[];
  onCancel: () => void;
  onApply: (finalApgs: APG[], summary: string) => void;
}

const key = (p: number, n: number) => `${p}|${n}`;

export function ImportDialog({ incoming, existing, onCancel, onApply }: Props) {
  const { conflicts, nonConflicting } = useMemo(() => {
    const byKey = new Map(existing.map((a) => [key(a.periodo, a.numero), a]));
    const conflicts: Conflict[] = [];
    const nonConflicting: unknown[] = [];
    for (const raw of incoming) {
      const r = raw as any;
      const periodo = Math.max(1, Math.round(Number(r?.periodo)) || 1);
      const numero = Math.max(1, Math.round(Number(r?.numero)) || 1);
      const cur = byKey.get(key(periodo, numero));
      if (cur) {
        conflicts.push({
          raw,
          periodo,
          numero,
          incomingTitle: typeof r?.titulo === "string" && r.titulo ? r.titulo : "Sem título",
          currentTitle: cur.titulo || "Sem título",
        });
      } else {
        nonConflicting.push(raw);
      }
    }
    return { conflicts, nonConflicting };
  }, [incoming, existing]);

  const [choices, setChoices] = useState<Choice[]>(() => conflicts.map(() => "replace"));

  const setAll = (c: Choice) => setChoices(conflicts.map(() => c));
  const setOne = (i: number, c: Choice) =>
    setChoices((prev) => prev.map((x, idx) => (idx === i ? c : x)));

  const apply = () => {
    const result = [...existing];
    let replaced = 0;
    let added = 0;
    let kept = 0;

    const nextFreeNumero = (periodo: number, desired: number): number => {
      const used = new Set(result.filter((a) => a.periodo === periodo).map((a) => a.numero));
      if (!used.has(desired)) return desired;
      let n = Math.max(0, ...result.filter((a) => a.periodo === periodo).map((a) => a.numero)) + 1;
      while (used.has(n)) n += 1;
      return n;
    };

    // Non-conflicting → add (avoid colliding with anything already added).
    for (const raw of nonConflicting) {
      const a = importApg(raw);
      a.numero = nextFreeNumero(a.periodo, a.numero);
      result.push(a);
      added += 1;
    }

    // Conflicts → per the chosen action.
    conflicts.forEach((c, i) => {
      const choice = choices[i];
      if (choice === "keep-current") {
        kept += 1;
        return;
      }
      const a = importApg(c.raw);
      if (choice === "replace") {
        const idx = result.findIndex((x) => x.periodo === c.periodo && x.numero === c.numero);
        if (idx >= 0) {
          result[idx] = { ...a, id: result[idx].id, periodo: c.periodo, numero: c.numero };
          replaced += 1;
        } else {
          a.numero = nextFreeNumero(a.periodo, a.numero);
          result.push(a);
          added += 1;
        }
      } else {
        // keep-both → add as a copy with a free number.
        a.numero = nextFreeNumero(a.periodo, c.numero);
        result.push(a);
        added += 1;
      }
    });

    const parts = [];
    if (added) parts.push(`${added} adicionada(s)`);
    if (replaced) parts.push(`${replaced} substituída(s)`);
    if (kept) parts.push(`${kept} mantida(s)`);
    onApply(result, parts.join(" · ") || "Nada a importar");
  };

  return (
    <div className="modal-overlay" role="dialog" aria-label="Importar APGs">
      <div className="modal">
        <div className="modal-head">Importar APGs</div>
        <div className="modal-body scroll-thin">
          <p className="hint" style={{ marginTop: 0 }}>
            {nonConflicting.length > 0 && (
              <>
                <strong>{nonConflicting.length}</strong> APG(s) nova(s) serão adicionadas.{" "}
              </>
            )}
            {conflicts.length > 0 ? (
              <>
                <strong>{conflicts.length}</strong> em conflito (mesmo Período + Número) — escolha o
                que fazer:
              </>
            ) : (
              "Nenhum conflito."
            )}
          </p>

          {conflicts.length > 0 && (
            <div className="conflict-allbar">
              Aplicar a todos:
              <button className="chip" onClick={() => setAll("replace")}>
                Substituir
              </button>
              <button className="chip" onClick={() => setAll("keep-current")}>
                Manter atuais
              </button>
              <button className="chip" onClick={() => setAll("keep-both")}>
                Manter ambas
              </button>
            </div>
          )}

          {conflicts.map((c, i) => (
            <div key={i} className="conflict-row">
              <div className="conflict-info">
                <span className="badge">
                  P{c.periodo} · APG {c.numero}
                </span>
                <div className="conflict-titles">
                  <div>
                    Atual: <strong>{c.currentTitle}</strong>
                  </div>
                  <div>
                    Importada: <strong>{c.incomingTitle}</strong>
                  </div>
                </div>
              </div>
              <div className="conflict-choices">
                {(
                  [
                    ["replace", "Substituir"],
                    ["keep-current", "Manter atual"],
                    ["keep-both", "Manter ambas"],
                  ] as [Choice, string][]
                ).map(([val, label]) => (
                  <label key={val} className={`conflict-opt ${choices[i] === val ? "on" : ""}`}>
                    <input
                      type="radio"
                      name={`c${i}`}
                      checked={choices[i] === val}
                      onChange={() => setOne(i, val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={apply}>
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
