// Visual customization: brand colors and font sizes, with presets + fine
// adjustment. Defaults to the DomineAqui dark-green palette.
import React from "react";
import { useApp } from "../state/store";
import { DEFAULT_THEME, ThemeSettings } from "../state/types";

const FONT_PRESETS: { label: string; v: Partial<ThemeSettings> }[] = [
  { label: "Compacto", v: { titleSize: 15, subtitleSize: 12, bodySize: 11 } },
  { label: "Padrão ABNT", v: { titleSize: 18, subtitleSize: 13, bodySize: 12 } },
  { label: "Ampliado", v: { titleSize: 22, subtitleSize: 15, bodySize: 13 } },
];

const COLOR_PRESETS: { label: string; v: Partial<ThemeSettings> }[] = [
  {
    label: "Verde DomineAqui",
    v: { primary: "#1B4332", primaryDark: "#0B2B20", accent: "#2D6A4F" },
  },
  {
    label: "Floresta",
    v: { primary: "#14502d", primaryDark: "#0a3019", accent: "#2f8f4e" },
  },
  {
    label: "Esmeralda",
    v: { primary: "#04563b", primaryDark: "#022e21", accent: "#10b981" },
  },
];

function Color({
  label,
  k,
}: {
  label: string;
  k: keyof Pick<ThemeSettings, "primary" | "primaryDark" | "accent" | "text">;
}) {
  const { state, dispatch } = useApp();
  return (
    <label className="color-field">
      <input
        type="color"
        value={state.theme[k]}
        onChange={(e) => dispatch({ type: "SET_THEME", patch: { [k]: e.target.value } })}
      />
      {label}
    </label>
  );
}

function Slider({
  label,
  k,
  min,
  max,
}: {
  label: string;
  k: keyof Pick<ThemeSettings, "titleSize" | "subtitleSize" | "bodySize">;
  min: number;
  max: number;
}) {
  const { state, dispatch } = useApp();
  return (
    <div className="slider-field">
      <div className="lbl">
        <span>{label}</span>
        <span>{state.theme[k]} pt</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={state.theme[k]}
        onChange={(e) =>
          dispatch({ type: "SET_THEME", patch: { [k]: Number(e.target.value) } })
        }
      />
    </div>
  );
}

export function ThemePanel() {
  const { dispatch } = useApp();

  return (
    <>
      <div className="section-title">Personalização visual</div>
      <div className="card">
        <div className="lbl" style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
          Paleta
        </div>
        <div className="preset-row">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.label}
              className="chip"
              onClick={() => dispatch({ type: "SET_THEME", patch: p.v })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="color-grid">
          <Color label="Primária" k="primary" />
          <Color label="Capa (escura)" k="primaryDark" />
          <Color label="Destaque" k="accent" />
          <Color label="Texto" k="text" />
        </div>

        <div
          className="lbl"
          style={{ fontWeight: 700, fontSize: 12, margin: "16px 0 6px" }}
        >
          Tamanho das fontes
        </div>
        <div className="preset-row">
          {FONT_PRESETS.map((p) => (
            <button
              key={p.label}
              className="chip"
              onClick={() => dispatch({ type: "SET_THEME", patch: p.v })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Slider label="Títulos" k="titleSize" min={12} max={28} />
        <Slider label="Subtítulos" k="subtitleSize" min={10} max={20} />
        <Slider label="Corpo" k="bodySize" min={9} max={16} />

        <button
          className="btn btn-ghost btn-block btn-xs"
          style={{ marginTop: 6 }}
          onClick={() => dispatch({ type: "SET_THEME", patch: { ...DEFAULT_THEME } })}
        >
          Restaurar padrão DomineAqui
        </button>
      </div>
    </>
  );
}
