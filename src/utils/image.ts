// Turning an uploaded file into a picture the app can store.
//
// Every picture is downscaled and recompressed on the way in, to a hard byte
// budget. That budget is what makes saving predictable: pictures now travel to
// the server one request each, and staying comfortably under the platform's
// body limit is what stops a save (and with it, the picture) from being lost.
// Quality is chosen adaptively — the encoder only drops quality as far as it
// has to in order to fit.

import { APGImage } from "../state/types";
import { revOf } from "../state/blobs";

// Longest side, in pixels. 1600px is still crisp at A4 print width; the export
// modes can shrink further on output.
const MAX_DIM = 1600;
// Quality ladder: the first step that fits the budget wins.
const QUALITY_STEPS = [0.85, 0.78, 0.7, 0.62, 0.55];
// Byte budget per picture (data-URL characters ≈ bytes). ~700 KB keeps even an
// APG full of figures far below every limit in the pipeline.
const MAX_BYTES = 700_000;
// Last resort when even the lowest quality doesn't fit: shrink and try again.
const FALLBACK_DIM = 1100;

interface Compressed {
  dataUrl: string;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function draw(img: HTMLImageElement, maxDim: number): HTMLCanvasElement | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // JPEG has no alpha — flatten onto white so transparent PNGs don't go black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Downscale + recompress a data URL, stopping at the first quality that fits
 * the byte budget. Falls back to the original on any failure, and never
 * produces something larger than the input.
 */
async function compressDataUrl(srcDataUrl: string): Promise<Compressed> {
  // SVGs are vector + tiny; don't rasterize them.
  if (srcDataUrl.startsWith("data:image/svg")) {
    return { dataUrl: srcDataUrl, width: 0, height: 0 };
  }
  const img = await loadImage(srcDataUrl);
  if (!img) return { dataUrl: "", width: 0, height: 0 };
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return { dataUrl: srcDataUrl, width: 0, height: 0 };

  const attempt = (maxDim: number): Compressed | null => {
    const canvas = draw(img, maxDim);
    if (!canvas) return null;
    let best: string | null = null;
    for (const q of QUALITY_STEPS) {
      let out: string;
      try {
        out = canvas.toDataURL("image/jpeg", q);
      } catch {
        return null;
      }
      best = out;
      if (out.length <= MAX_BYTES) break;
    }
    return best ? { dataUrl: best, width: canvas.width, height: canvas.height } : null;
  };

  let result = attempt(MAX_DIM);
  if (result && result.dataUrl.length > MAX_BYTES) {
    // Still too heavy at the lowest quality → give up some resolution instead.
    result = attempt(FALLBACK_DIM) ?? result;
  }
  if (!result) return { dataUrl: srcDataUrl, width: w, height: h };
  // Never make a picture bigger than it already was.
  if (result.dataUrl.length >= srcDataUrl.length) {
    return { dataUrl: srcDataUrl, width: w, height: h };
  }
  return result;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export async function fileToImage(file: File, id: string): Promise<APGImage> {
  if (!file.type.startsWith("image/")) throw new Error("O arquivo não é uma imagem.");
  const raw = await readAsDataUrl(file);
  const c = await compressDataUrl(raw);
  if (!c.dataUrl) throw new Error("Imagem inválida.");
  return {
    id,
    dataUrl: c.dataUrl,
    caption: "",
    width: c.width,
    height: c.height,
    rev: revOf(c.dataUrl),
  };
}

/** Next free image id (img1, img2, ...) for an APG. */
export function nextImageId(existing: { id: string }[]): string {
  let n = 1;
  const used = new Set(existing.map((i) => i.id));
  while (used.has(`img${n}`)) n += 1;
  return `img${n}`;
}

/**
 * Fetch a remote image URL and convert it to a compressed base64 data URL so it
 * can be embedded in the PDF (pdfmake does not fetch remote URLs in the browser).
 * Throws on network/CORS failure or non-image content so callers can fall back.
 */
export async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Não foi possível baixar a imagem (HTTP ${res.status}).`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("A URL não aponta para uma imagem.");
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao processar a imagem."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  const c = await compressDataUrl(raw);
  return c.dataUrl || raw;
}

/** Read an uploaded image File to a compressed data URL (no APGImage wrapper). */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("O arquivo não é uma imagem.");
  const raw = await readAsDataUrl(file);
  const c = await compressDataUrl(raw);
  if (!c.dataUrl) throw new Error("Imagem inválida.");
  return c.dataUrl;
}
