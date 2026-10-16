import { ToolError } from '@/core/types';

/** A recognised word. Coordinates are pixels in the rendered page image, origin top-left. */
export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrPageResult {
  text: string;
  words: OcrWord[];
  /** 0–100 */
  confidence: number;
}

export const DPI_CHOICES = [150, 200, 300] as const;
export const DEFAULT_DPI = 200;

/** Pull every word out of Tesseract's block → paragraph → line → word tree. */
export function wordsFromBlocks(
  blocks: ReadonlyArray<{ paragraphs: ReadonlyArray<{ lines: ReadonlyArray<{ words: ReadonlyArray<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> }> }> }> | null | undefined,
): OcrWord[] {
  const out: OcrWord[] = [];
  for (const b of blocks ?? [])
    for (const p of b.paragraphs)
      for (const l of p.lines)
        for (const w of l.words) {
          const text = w.text.trim();
          if (text) out.push({ text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 });
        }
  return out;
}

/** The built-in PDF fonts can only write Latin-1 text; anything else becomes "?" so saving never fails. */
export function latin1Safe(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const c = ch.codePointAt(0)!;
    out += c >= 0x20 && c <= 0xff && !(c >= 0x7f && c <= 0x9f) ? ch : c === 0x2019 || c === 0x2018 ? "'" : c === 0x201c || c === 0x201d ? '"' : c === 0x2013 || c === 0x2014 ? '-' : '?';
  }
  return out;
}

/**
 * Where to put an invisible word on the PDF page so it lines up with the printed word.
 * `scale` is image pixels per PDF point; `widthAt1` is the word's width at font size 1.
 */
export function placeWord(w: OcrWord, scale: number, pageHeightPt: number, widthAt1: number): { x: number; y: number; size: number } {
  const wPt = (w.x1 - w.x0) / scale;
  const hPt = (w.y1 - w.y0) / scale;
  const bySize = widthAt1 > 0 ? wPt / widthAt1 : hPt;
  const size = Math.min(Math.max(bySize, 2), Math.max(hPt * 1.6, 2));
  return { x: w.x0 / scale, y: pageHeightPt - w.y1 / scale + hPt * 0.2, size };
}

/** All pages' text in one block. With several pages, each is introduced by a divider so the reader can tell them apart. */
export function joinPages(texts: readonly string[], pageNumbers?: readonly number[]): string {
  const clean = texts.map((t) => t.replace(/\s+$/g, ''));
  if (clean.length <= 1) return clean[0] ?? '';
  return clean.map((t, i) => `--- Page ${pageNumbers?.[i] ?? i + 1} ---\n${t}`).join('\n\n');
}

export function averageConfidence(pages: ReadonlyArray<{ confidence: number; words: readonly unknown[] }>): number {
  let total = 0;
  let n = 0;
  for (const p of pages) {
    if (!p.words.length) continue;
    total += p.confidence * p.words.length;
    n += p.words.length;
  }
  return n ? Math.round((total / n) * 10) / 10 : 0;
}

export function outputName(inputName: string, kind: 'pdf' | 'txt'): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'document';
  return kind === 'pdf' ? `${base}-searchable.pdf` : `${base}.txt`;
}

export function isImageFile(f: { type: string; name: string }): boolean {
  return f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|avif)$/i.test(f.name);
}

export function isPdf(f: { type: string; name: string }): boolean {
  return f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
}

/** Splits dropped files into the one PDF, or the pictures, to read. Mixing the two is not supported. */
export function classifyInput<T extends { type: string; name: string }>(files: readonly T[]): { pdf: T | null; images: T[] } {
  const pdf = files.find(isPdf) ?? null;
  const images = files.filter(isImageFile);
  if (pdf && images.length) throw new ToolError('Drop either one PDF or some pictures, not both.');
  return { pdf, images };
}
