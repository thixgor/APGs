// Import/export of an APG's exercise list in a human-friendly plain-text
// (markdown-ish) format — NOT JSON, so it can be authored or pasted by hand.
//
// Canonical format (forgiving on input; this exact shape is what we emit):
//
//   # Lista de Exercícios            (optional title; ignored on import)
//
//   1. Enunciado da questão (pode ter várias linhas)
//   img: https://exemplo.com/figura.png | Legenda opcional
//   A) Alternativa A
//   B) Alternativa B
//   C) Alternativa C
//   D) Alternativa D
//   Gabarito: B
//   Comentário: Explicação da resposta correta...
//
//   2. Enunciado de uma questão discursiva...
//   Gabarito: Resposta esperada (modelo).
//   Comentário: Observações adicionais.
//
// Accepted variations on input:
//   - Question start:  "1." or "1)"
//   - Image:           "img: URL | legenda"  OR  markdown  ![legenda](URL "legenda")
//   - Options:         "A)" "A." "A-" "(A)"  (letters A–H; label is positional)
//   - Gabarito:        "Gabarito:" / "Resposta:" / "= "
//   - Comentário:      "Comentário:" / "Explicação:" / "> "
//
// Kind is inferred: any options → "objetiva"; none → "discursiva".

import type { Exercise, ExerciseKind } from "../state/types";

/** Positional option letter: 0 → "A", 1 → "B", … */
export function letterFor(i: number): string {
  return String.fromCharCode(65 + i);
}

let idCounter = 0;
export function genExerciseId(): string {
  idCounter += 1;
  return `ex${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/** A fresh, empty exercise of the given kind. */
export function blankExercise(kind: ExerciseKind): Exercise {
  return {
    id: genExerciseId(),
    kind,
    statement: "",
    options: kind === "objetiva" ? ["", "", "", ""] : [],
    correct: -1,
    answer: "",
    explanation: "",
  };
}

const RE_QUESTION = /^\s*(\d+)[.)]\s+(.*)$/;
const RE_OPTION = /^\s*\(?([A-Ha-h])[)\.\-]\s+(.*)$/;
const RE_IMG = /^\s*img\s*:\s*(.+)$/i;
const RE_MD_IMG = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const RE_GAB = /^\s*(?:gabarito|resposta)\s*:\s*(.+)$/i;
const RE_GAB_EQ = /^\s*=\s*(.+)$/;
const RE_COM = /^\s*(?:coment[aá]rio|explica[cç][aã]o)\s*:\s*(.+)$/i;
const RE_COM_GT = /^\s*>\s*(.+)$/;

function splitUrlCaption(s: string): [string, string] {
  const i = s.indexOf("|");
  if (i >= 0) return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  return [s.trim(), ""];
}

/** Parse the plain-text format into Exercise objects. Tolerant of variations. */
export function parseExercises(md: string): Exercise[] {
  const lines = md.split(/\r?\n/);
  const out: Exercise[] = [];
  let cur: Exercise | null = null;
  let target: "statement" | "explanation" | null = null;

  const push = () => {
    if (cur) {
      if (cur.kind === "objetiva" && cur.options.length === 0) cur.kind = "discursiva";
      out.push(cur);
    }
    cur = null;
    target = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    const mQ = line.match(RE_QUESTION);
    if (mQ) {
      push();
      cur = {
        id: genExerciseId(),
        kind: "discursiva",
        statement: mQ[2].trim(),
        options: [],
        correct: -1,
        answer: "",
        explanation: "",
      };
      target = "statement";
      continue;
    }

    if (!cur) continue; // ignore titles / preamble before the first question

    const mImg = line.match(RE_IMG);
    if (mImg) {
      const [url, cap] = splitUrlCaption(mImg[1]);
      cur.imageUrl = url;
      if (cap) cur.imageCaption = cap;
      target = null;
      continue;
    }
    const mMd = line.match(RE_MD_IMG);
    if (mMd) {
      cur.imageUrl = mMd[2];
      const cap = mMd[3] || mMd[1];
      if (cap) cur.imageCaption = cap;
      target = null;
      continue;
    }

    const mOpt = line.match(RE_OPTION);
    if (mOpt) {
      cur.kind = "objetiva";
      cur.options.push(mOpt[2].trim());
      target = null;
      continue;
    }

    const mGab = line.match(RE_GAB) || line.match(RE_GAB_EQ);
    if (mGab) {
      const val = mGab[1].trim();
      if (cur.kind === "objetiva") {
        const m = val.match(/[A-Ha-h]/);
        cur.correct = m ? m[0].toUpperCase().charCodeAt(0) - 65 : -1;
      } else {
        cur.answer = val;
      }
      target = null;
      continue;
    }

    const mCom = line.match(RE_COM) || line.match(RE_COM_GT);
    if (mCom) {
      cur.explanation = mCom[1].trim();
      target = "explanation";
      continue;
    }

    if (!trimmed) {
      target = null; // blank line ends free-text accumulation
      continue;
    }

    // Continuation of a multi-line statement or comment.
    if (target === "statement") cur.statement += `\n${trimmed}`;
    else if (target === "explanation") cur.explanation += `\n${trimmed}`;
  }

  push();
  return out;
}

/** Serialize exercises back to the canonical plain-text format. */
export function exercisesToMarkdown(exs: Exercise[]): string {
  const parts: string[] = ["# Lista de Exercícios", ""];
  exs.forEach((ex, i) => {
    parts.push(`${i + 1}. ${ex.statement.replace(/\n/g, "\n   ")}`);
    if (ex.imageUrl) {
      parts.push(`img: ${ex.imageUrl}${ex.imageCaption ? ` | ${ex.imageCaption}` : ""}`);
    }
    if (ex.kind === "objetiva") {
      ex.options.forEach((opt, oi) => parts.push(`${letterFor(oi)}) ${opt}`));
      parts.push(`Gabarito: ${ex.correct >= 0 ? letterFor(ex.correct) : "?"}`);
    } else if (ex.answer) {
      parts.push(`Gabarito: ${ex.answer.replace(/\n/g, " ")}`);
    }
    if (ex.explanation) parts.push(`Comentário: ${ex.explanation.replace(/\n/g, " ")}`);
    parts.push("");
  });
  return `${parts.join("\n").trim()}\n`;
}
