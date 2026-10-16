import { PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { loadPdf, extractPages } from '../_lib/pdflib';
import { pad } from '../_lib/files';
import { parsePageRanges, splitGroups } from '../_lib/pages';
import { zipStored } from '../_lib/zip';

export type SplitMode =
  /** All selected pages into one PDF. */
  | 'extract'
  /** Each comma-separated range into its own PDF. */
  | 'ranges'
  /** A new PDF every N pages. */
  | 'every';

export interface SplitOptions {
  mode: SplitMode;
  /** Page selection for 'extract' and 'ranges'. */
  pages: string;
  /** Chunk size for 'every'. */
  every: number;
}

export interface SplitFile {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
}

async function save(src: PDFDocument, indexes: number[]): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const doc = await extractPages(src, indexes);
  return { bytes: await doc.save(), pageCount: doc.getPageCount() };
}

/** Split a PDF into one or more PDFs. `base` is the original file name without extension. */
export async function splitPdf(input: Uint8Array | ArrayBuffer, base: string, options: SplitOptions): Promise<SplitFile[]> {
  const src = await loadPdf(input);
  const total = src.getPageCount();
  if (options.mode === 'extract') {
    const pages = parsePageRanges(options.pages, total);
    const out = await save(src, pages.map((p) => p - 1));
    return [{ name: `${base}-pages.pdf`, ...out }];
  }
  if (options.mode === 'ranges') {
    const groups = splitGroups(options.pages);
    if (!groups.length) throw new ToolError('Enter the page ranges you want, for example 1-3, 4-6, 9');
    const files: SplitFile[] = [];
    for (const [i, g] of groups.entries()) {
      const pages = parsePageRanges(g, total);
      const out = await save(src, pages.map((p) => p - 1));
      files.push({ name: `${base}-${pad(i + 1, groups.length)}-pages-${g.replace(/\s+/g, '')}.pdf`, ...out });
    }
    return files;
  }
  const n = Math.floor(options.every);
  if (!Number.isFinite(n) || n < 1) throw new ToolError('Pages per file must be at least 1.');
  const parts = Math.ceil(total / n);
  const files: SplitFile[] = [];
  for (let i = 0; i < parts; i++) {
    const start = i * n;
    const idx = Array.from({ length: Math.min(n, total - start) }, (_, k) => start + k);
    const out = await save(src, idx);
    files.push({ name: `${base}-${pad(i + 1, parts)}.pdf`, ...out });
  }
  return files;
}

export interface SplitOutput {
  kind: 'pdf' | 'zip';
  name: string;
  bytes: Uint8Array;
  fileCount: number;
  pageCount: number;
}

/** One file stays a PDF; several are bundled into a ZIP. */
export async function splitToOutput(input: Uint8Array | ArrayBuffer, base: string, options: SplitOptions): Promise<SplitOutput> {
  const files = await splitPdf(input, base, options);
  const pageCount = files.reduce((n, f) => n + f.pageCount, 0);
  if (files.length === 1) return { kind: 'pdf', name: files[0]!.name, bytes: files[0]!.bytes, fileCount: 1, pageCount };
  return { kind: 'zip', name: `${base}-split.zip`, bytes: zipStored(files), fileCount: files.length, pageCount };
}
