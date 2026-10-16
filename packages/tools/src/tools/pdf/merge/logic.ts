import { PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { loadPdf } from '../_lib/pdflib';

export interface MergeInput {
  name: string;
  bytes: Uint8Array | ArrayBuffer;
}

export interface MergeResult {
  bytes: Uint8Array;
  pageCount: number;
}

/** Concatenate the pages of every input, in order. */
export async function mergePdfs(inputs: MergeInput[]): Promise<MergeResult> {
  if (inputs.length < 2) throw new ToolError('Add at least two PDFs to merge.');
  const out = await PDFDocument.create();
  for (const input of inputs) {
    let src: PDFDocument;
    try {
      src = await loadPdf(input.bytes);
    } catch (e) {
      throw new ToolError(`${input.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }
  const bytes = await out.save();
  return { bytes, pageCount: out.getPageCount() };
}
