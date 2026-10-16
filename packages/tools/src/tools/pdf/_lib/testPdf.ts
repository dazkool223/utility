import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';

/** Test helper: a PDF whose page n is (200 + 10n) points wide, so page order can be read back from the sizes. */
export async function makePdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let n = 1; n <= pageCount; n++) {
    const page = doc.addPage([200 + 10 * n, 300]);
    page.drawText(`Page ${n}`, { x: 20, y: 150, size: 18, font });
  }
  return doc.save();
}

/** Page widths of a PDF, in page order. */
export async function pageWidths(bytes: Uint8Array | ArrayBuffer): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => Math.round(p.getWidth()));
}

export function widthOfPage(n: number): number {
  return 200 + 10 * n;
}
