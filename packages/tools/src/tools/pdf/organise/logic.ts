import { degrees } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { loadPdf, extractPages } from '../_lib/pdflib';

export interface PagePlan {
  /** 0-based page index in the source PDF. */
  index: number;
  /** Extra clockwise rotation in degrees, a multiple of 90. */
  rotate: number;
}

export interface OrganiseResult {
  bytes: Uint8Array;
  pageCount: number;
}

/** Build a new PDF from the source pages listed in `plan`, in that order. Pages not listed are deleted. */
export async function organisePdf(input: Uint8Array | ArrayBuffer, plan: PagePlan[]): Promise<OrganiseResult> {
  if (!plan.length) throw new ToolError('Keep at least one page. Restore a deleted page to continue.');
  const src = await loadPdf(input);
  const total = src.getPageCount();
  for (const p of plan) {
    if (!Number.isInteger(p.index) || p.index < 0 || p.index >= total) throw new ToolError(`Page ${p.index + 1} does not exist. This PDF has ${total} pages.`);
    if (!Number.isInteger(p.rotate) || p.rotate % 90 !== 0) throw new ToolError('Pages can only be turned in steps of 90 degrees.');
  }
  const out = await extractPages(src, plan.map((p) => p.index));
  out.getPages().forEach((page, i) => {
    const extra = plan[i]!.rotate;
    if (extra) page.setRotation(degrees((((page.getRotation().angle + extra) % 360) + 360) % 360));
  });
  return { bytes: await out.save(), pageCount: out.getPageCount() };
}
