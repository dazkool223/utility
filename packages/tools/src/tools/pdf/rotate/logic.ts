import { degrees } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { loadPdf } from '../_lib/pdflib';
import { parsePageRanges } from '../_lib/pages';

export type RotateAngle = 90 | 180 | 270;

export interface RotateResult {
  bytes: Uint8Array;
  pageCount: number;
  rotated: number;
}

/**
 * Rotate pages clockwise by `angle`, added to whatever rotation they already have.
 * An empty `pages` selection means every page.
 */
export async function rotatePdf(input: Uint8Array | ArrayBuffer, angle: RotateAngle, pages: string): Promise<RotateResult> {
  if (![90, 180, 270].includes(angle)) throw new ToolError('Choose a rotation of 90, 180 or 270 degrees.');
  const doc = await loadPdf(input);
  const total = doc.getPageCount();
  const wanted = pages.trim() ? [...new Set(parsePageRanges(pages, total))] : Array.from({ length: total }, (_, i) => i + 1);
  const all = doc.getPages();
  for (const n of wanted) {
    const page = all[n - 1]!;
    const current = page.getRotation().angle;
    page.setRotation(degrees((((current + angle) % 360) + 360) % 360));
  }
  return { bytes: await doc.save(), pageCount: total, rotated: wanted.length };
}
