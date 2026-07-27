// "2 pages per sheet" (2-up) imposition for economical printing of apostilas.
//
// Takes the already-generated A4 portrait PDF and places two consecutive logical
// pages, side by side, on each A4 LANDSCAPE sheet. Because the A-series ratio is
// 1:√2, an A4 portrait page scales by ~0.707 to exactly A5 — two of them fill an
// A4 landscape sheet edge to edge, with no re-layout and no content loss. A faint
// dashed line marks the center so the sheet can be cut in half by hand.

import { PDFDocument, rgb } from "pdf-lib";

// A4 landscape, in PostScript points.
const SHEET_W = 841.89;
const SHEET_H = 595.28;

export async function impose2up(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  // Embed every source page as a reusable XObject (vector, lossless).
  const embedded = await out.embedPdf(bytes, src.getPageIndices());

  const halfW = SHEET_W / 2;
  for (let i = 0; i < embedded.length; i += 2) {
    const sheet = out.addPage([SHEET_W, SHEET_H]);
    for (let slot = 0; slot < 2; slot++) {
      const ep = embedded[i + slot];
      if (!ep) break;
      const scale = Math.min(halfW / ep.width, SHEET_H / ep.height);
      const w = ep.width * scale;
      const h = ep.height * scale;
      const x = slot * halfW + (halfW - w) / 2;
      const y = (SHEET_H - h) / 2;
      sheet.drawPage(ep, { x, y, xScale: scale, yScale: scale });
    }
    // Center cut guide.
    sheet.drawLine({
      start: { x: halfW, y: 0 },
      end: { x: halfW, y: SHEET_H },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.82),
      dashArray: [3, 3],
    });
  }

  return await out.save();
}
