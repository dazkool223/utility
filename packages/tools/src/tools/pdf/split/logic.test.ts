import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { splitPdf, splitToOutput } from './logic';
import { makePdf, pageWidths, widthOfPage } from '../_lib/testPdf';

describe('splitPdf', () => {
  it('extracts a selection into one PDF, in the order given', async () => {
    const files = await splitPdf(await makePdf(6), 'doc', { mode: 'extract', pages: '5, 1-2', every: 1 });
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe('doc-pages.pdf');
    expect(await pageWidths(files[0]!.bytes)).toEqual([5, 1, 2].map(widthOfPage));
  });
  it('writes one file per range', async () => {
    const files = await splitPdf(await makePdf(6), 'doc', { mode: 'ranges', pages: '1-2, 6', every: 1 });
    expect(files.map((f) => f.pageCount)).toEqual([2, 1]);
    expect(files.map((f) => f.name)).toEqual(['doc-1-pages-1-2.pdf', 'doc-2-pages-6.pdf']);
    expect(await pageWidths(files[1]!.bytes)).toEqual([widthOfPage(6)]);
  });
  it('cuts every N pages, with a shorter last file', async () => {
    const files = await splitPdf(await makePdf(5), 'doc', { mode: 'every', pages: '', every: 2 });
    expect(files.map((f) => f.pageCount)).toEqual([2, 2, 1]);
    expect(files.map((f) => f.name)).toEqual(['doc-1.pdf', 'doc-2.pdf', 'doc-3.pdf']);
  });
  it('gives one file when N covers the whole document', async () => {
    const files = await splitPdf(await makePdf(3), 'doc', { mode: 'every', pages: '', every: 10 });
    expect(files).toHaveLength(1);
    expect(files[0]!.pageCount).toBe(3);
  });
  it('rejects pages that do not exist', async () => {
    await expect(splitPdf(await makePdf(3), 'doc', { mode: 'extract', pages: '4', every: 1 })).rejects.toThrow(/Page 4 does not exist/);
  });
  it('rejects an invalid chunk size', async () => {
    await expect(splitPdf(await makePdf(3), 'doc', { mode: 'every', pages: '', every: 0 })).rejects.toThrow(/at least 1/);
    await expect(splitPdf(await makePdf(3), 'doc', { mode: 'every', pages: '', every: Number.NaN })).rejects.toThrow(/at least 1/);
  });
  it('rejects empty ranges', async () => {
    await expect(splitPdf(await makePdf(3), 'doc', { mode: 'ranges', pages: ' ', every: 1 })).rejects.toThrow(/Enter the page ranges/);
  });
  it('rejects input that is not a PDF', async () => {
    await expect(splitPdf(new TextEncoder().encode('hello'), 'doc', { mode: 'extract', pages: '1', every: 1 })).rejects.toThrow(/not a valid PDF|could not be read/);
  });
});

describe('splitToOutput', () => {
  it('returns a PDF for a single file', async () => {
    const out = await splitToOutput(await makePdf(3), 'doc', { mode: 'extract', pages: '2', every: 1 });
    expect(out.kind).toBe('pdf');
    expect(out.pageCount).toBe(1);
  });
  it('bundles several files into a ZIP', async () => {
    const out = await splitToOutput(await makePdf(4), 'doc', { mode: 'every', pages: '', every: 2 });
    expect(out.kind).toBe('zip');
    expect(out.name).toBe('doc-split.zip');
    expect(out.fileCount).toBe(2);
    expect(Object.keys(unzipSync(out.bytes)).sort()).toEqual(['doc-1.pdf', 'doc-2.pdf']);
  });
});
