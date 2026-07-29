// Reads an uploaded image File into an APGImage (data URL + natural size).
// Images are downscaled/recompressed on the way in so a few photos don't blow
// the localStorage quota — which previously caused saves to fail silently and
// images to "disappear" after a reload.

import { APGImage } from "../state/types";

// Stored-image budget. Kept moderate so a whole caderno (dozens of APGs with
// images) stays small enough to ALWAYS save reliably — a too-large store was
// failing to write and causing data loss. 1600px @ q0.82 is still crisp for
// screen and print; the PDF export modes can shrink further on output.
const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

// Hard ceiling per stored image. Each image is uploaded in its own request, and
// a serverless function refuses a body over ~4.5 MB, so an image that lands
// above this is re-encoded smaller instead of becoming an APG that can never be
// saved. Ladder of (max dimension, quality) fallbacks, tried in order.
const MAX_IMAGE_CHARS = 1_200_000;
const FALLBACKS: [number, number][] = [
  [1600, 0.7],
  [1400, 0.65],
  [1200, 0.6],
  [1000, 0.5],
  [800, 0.45],
];

interface Compressed {
  dataUrl: string;
  width: number;
  height: number;
}

/** Downscale + recompress a data URL via canvas. Falls back to the original on
 *  any failure, and never produces something larger than the input. */
function compressDataUrl(
  srcDataUrl: string,
  maxDim = MAX_DIM,
  quality = JPEG_QUALITY
): Promise<Compressed> {
  return new Promise((resolve) => {
    // SVGs are vector + tiny; don't rasterize them.
    if (srcDataUrl.startsWith("data:image/svg")) {
      resolve({ dataUrl: srcDataUrl, width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.onerror = () => resolve({ dataUrl: "", width: 0, height: 0 });
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) {
        resolve({ dataUrl: srcDataUrl, width: 0, height: 0 });
        return;
      }

      /** Draw at `dim` and encode at `q`; null when the canvas is unusable. */
      const render = (dim: number, q: number): Compressed | null => {
        const scale = Math.min(1, dim / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        // JPEG has no alpha — flatten onto white so transparent PNGs don't go black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tw, th);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, tw, th);
        try {
          return { dataUrl: canvas.toDataURL("image/jpeg", q), width: tw, height: th };
        } catch {
          return null;
        }
      };

      const first = render(maxDim, quality);
      if (!first) {
        resolve({ dataUrl: srcDataUrl, width: w, height: h });
        return;
      }
      // Never grow the input…
      let best: Compressed =
        first.dataUrl.length < srcDataUrl.length
          ? first
          : { dataUrl: srcDataUrl, width: first.width, height: first.height };
      // …and never leave it above the per-image ceiling.
      for (const [dim, q] of FALLBACKS) {
        if (best.dataUrl.length <= MAX_IMAGE_CHARS) break;
        const next = render(dim, q);
        if (next && next.dataUrl.length < best.dataUrl.length) best = next;
      }
      resolve(best);
    };
    img.src = srcDataUrl;
  });
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
  return { id, dataUrl: c.dataUrl, caption: "", width: c.width, height: c.height };
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
