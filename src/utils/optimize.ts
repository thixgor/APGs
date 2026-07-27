// Image optimization for PDF export. The PDF weight (and the time pdfmake
// spends building it on the main thread) is dominated by embedded images stored
// as full-resolution data URLs. Before generating, we downscale and recompress
// every image according to the chosen export mode, which shrinks the file and
// speeds up generation dramatically.

import { APG } from "../state/types";

export type ExportMode = "compacto" | "equilibrado" | "alta";

interface ModeCfg {
  /** Max width/height in px (image is scaled down to fit). */
  maxDim: number;
  /** JPEG quality 0..1 (ignored when not re-encoding to JPEG). */
  quality: number;
  /** Re-encode photos as JPEG (much smaller). "alta" keeps the original. */
  jpeg: boolean;
}

export const MODE_CFG: Record<ExportMode, ModeCfg> = {
  compacto: { maxDim: 900, quality: 0.6, jpeg: true },
  equilibrado: { maxDim: 1400, quality: 0.8, jpeg: true },
  alta: { maxDim: Infinity, quality: 1, jpeg: false },
};

export const MODE_LABEL: Record<ExportMode, string> = {
  compacto: "Compacto",
  equilibrado: "Equilibrado",
  alta: "Alta qualidade",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem para otimizar."));
    img.src = src;
  });
}

/** Downscale + recompress a single data URL. Returns the original on any
 *  failure or when optimization wouldn't actually make it smaller. */
async function optimizeDataUrl(dataUrl: string, cfg: ModeCfg): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return dataUrl;
  // SVGs are vector + tiny; rasterizing would only hurt. Leave as-is.
  if (dataUrl.startsWith("data:image/svg")) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return dataUrl;

    const scale = Math.min(1, cfg.maxDim / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (cfg.jpeg) {
      // JPEG has no alpha — flatten onto white so transparent PNGs don't go black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tw, th);
    }
    ctx.drawImage(img, 0, 0, tw, th);

    const out = cfg.jpeg
      ? canvas.toDataURL("image/jpeg", cfg.quality)
      : canvas.toDataURL("image/png");
    // Never make an image bigger than it already was.
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

/**
 * Return a copy of the APGs with every embedded image optimized for the mode.
 * "alta" is a no-op (originals kept). Yields to the event loop between images
 * (await on image load) so the UI can paint a "generating" state.
 */
export async function optimizeApgs(apgs: APG[], mode: ExportMode): Promise<APG[]> {
  if (mode === "alta") return apgs;
  const cfg = MODE_CFG[mode];
  // Cache by source data URL so duplicated images are only re-encoded once.
  const cache = new Map<string, string>();
  const conv = async (d: string | undefined): Promise<string | undefined> => {
    if (!d) return d;
    const hit = cache.get(d);
    if (hit !== undefined) return hit;
    const o = await optimizeDataUrl(d, cfg);
    cache.set(d, o);
    return o;
  };

  const out: APG[] = [];
  for (const apg of apgs) {
    const images = [];
    for (const im of apg.images) {
      images.push({ ...im, dataUrl: (await conv(im.dataUrl)) as string });
    }
    const exercises = [];
    for (const ex of apg.exercises ?? []) {
      exercises.push({ ...ex, imageDataUrl: await conv(ex.imageDataUrl) });
    }
    out.push({ ...apg, images, exercises });
  }
  return out;
}
