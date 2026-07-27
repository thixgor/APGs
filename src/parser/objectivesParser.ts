// Parser for the OBJECTIVES block the user pastes verbatim.
//
// Expected format (multiple "Objetivo Geral" blocks allowed):
//
//   Objetivo Geral 1
//   Compreender a anatomia e a histologia dos pulmões...
//   Objetivos Específicos
//   1. Organização anatômica do sistema respiratório inferior
//   Identificar traqueia, brônquios...
//   Correlacionar a organização anatômica...
//   2. Anatomia macroscópica dos pulmões
//   Identificar pulmão direito e pulmão esquerdo.
//   Objetivo Geral 2
//   ...
//
// Rules:
//  - "Objetivo Geral N"      -> header of a general objective (description follows)
//  - "Objetivos Específicos" -> begins the specific-objectives list
//  - "N." / "N)"             -> numbered specific subtopic
//  - any other line          -> a bullet item under the current subtopic
//                               (or part of the general description, before
//                               "Objetivos Específicos")

import type { ObjectiveGeneral, ObjectiveSpecific } from "../state/types";

const RE_GERAL = /^objetivo\s+geral\s*(\d+)?\s*[:.\-–]?\s*(.*)$/i;
const RE_ESPECIFICOS = /^objetivos?\s+espec[ií]ficos\s*[:.]?\s*$/i;
// A numbered specific objective. Accepts:
//   single level, separator required:  "1." / "2)"
//   multi level, separator optional:   "1.1" / "1.1." / "2.1" / "1.10" / "1.1.2"
// The capture keeps the number (e.g. "1.1."); the trailing separator is stripped
// before storing so it renders as "1.1.".
const RE_NUMBERED = /^(\d+(?:\.\d+)+\.?|\d+[.)])\s+(.+)$/;

export function parseObjectives(raw: string): ObjectiveGeneral[] {
  const lines = raw.split(/\r?\n/);
  const generals: ObjectiveGeneral[] = [];

  let current: ObjectiveGeneral | null = null;
  let currentSpecific: ObjectiveSpecific | null = null;
  let mode: "description" | "specifics" = "description";
  // Holds description fragments before "Objetivos Específicos".
  let descBuffer: string[] = [];

  const flushDescription = () => {
    // Only write when there is buffered text — otherwise a later empty flush
    // (e.g. the final one, or when the next "Objetivo Geral" starts) would
    // wipe a description that was already captured.
    if (current && descBuffer.length) {
      current.description = descBuffer.join(" ").trim();
    }
    descBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const mGeral = line.match(RE_GERAL);
    if (mGeral) {
      // Close the previous general objective.
      flushDescription();
      current = {
        number: mGeral[1] ?? String(generals.length + 1),
        description: "",
        specifics: [],
      };
      // If text trailed the "Objetivo Geral N" header on the same line, keep it.
      if (mGeral[2]) descBuffer.push(mGeral[2].trim());
      generals.push(current);
      currentSpecific = null;
      mode = "description";
      continue;
    }

    if (RE_ESPECIFICOS.test(line)) {
      flushDescription();
      mode = "specifics";
      currentSpecific = null;
      continue;
    }

    if (!current) {
      // Content before any "Objetivo Geral" — start an implicit general.
      current = { number: "1", description: "", specifics: [] };
      generals.push(current);
      mode = "description";
    }

    if (mode === "description") {
      descBuffer.push(line);
      continue;
    }

    // mode === "specifics"
    const mNum = line.match(RE_NUMBERED);
    if (mNum) {
      // Strip a trailing separator: "1.1." -> "1.1", "2)" -> "2".
      const number = mNum[1].replace(/[.)]+$/, "");
      currentSpecific = { number, title: mNum[2].trim(), items: [] };
      current.specifics.push(currentSpecific);
    } else if (currentSpecific) {
      currentSpecific.items.push(line);
    } else {
      // A line in specifics mode before any numbered item: treat as a loose
      // subtopic so nothing is silently dropped.
      currentSpecific = {
        number: String(current.specifics.length + 1),
        title: line,
        items: [],
      };
      current.specifics.push(currentSpecific);
    }
  }

  flushDescription();
  return generals;
}
