import { latin1Safe, placeWord, type OcrWord } from './logic';

export interface SearchablePage {
  /** The page picture. */
  image: Uint8Array;
  kind: 'jpeg' | 'png';
  /** Page size in PDF points. */
  widthPt: number;
  heightPt: number;
  /** Image pixels per PDF point. */
  scale: number;
  words: readonly OcrWord[];
}

/**
 * Builds a PDF whose pages are the scanned pictures with the recognised text laid over them, invisible, so the
 * text can be searched, selected and copied. Pages are added one at a time so only one picture is held at once.
 */
export async function createSearchablePdf() {
  const { PDFDocument, StandardFonts } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  return {
    async addPage(p: SearchablePage) {
      const image = p.kind === 'jpeg' ? await doc.embedJpg(p.image) : await doc.embedPng(p.image);
      const page = doc.addPage([p.widthPt, p.heightPt]);
      page.drawImage(image, { x: 0, y: 0, width: p.widthPt, height: p.heightPt });
      for (const w of p.words) {
        const text = latin1Safe(w.text);
        const pos = placeWord(w, p.scale, p.heightPt, font.widthOfTextAtSize(text, 1));
        page.drawText(text, { x: pos.x, y: pos.y, size: pos.size, font, opacity: 0 });
      }
    },
    pageCount: () => doc.getPageCount(),
    save: () => doc.save(),
  };
}
