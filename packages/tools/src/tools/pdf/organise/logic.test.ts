import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { organisePdf } from './logic';
import { makePdf, pageWidths, widthOfPage } from '../_lib/testPdf';

describe('organisePdf', () => {
  it('reorders pages', async () => {
    const out = await organisePdf(await makePdf(3), [
      { index: 2, rotate: 0 },
      { index: 0, rotate: 0 },
      { index: 1, rotate: 0 },
    ]);
    expect(await pageWidths(out.bytes)).toEqual([3, 1, 2].map(widthOfPage));
  });
  it('deletes pages that are left out', async () => {
    const out = await organisePdf(await makePdf(4), [
      { index: 0, rotate: 0 },
      { index: 3, rotate: 0 },
    ]);
    expect(out.pageCount).toBe(2);
    expect(await pageWidths(out.bytes)).toEqual([1, 4].map(widthOfPage));
  });
  it('rotates pages', async () => {
    const out = await organisePdf(await makePdf(2), [
      { index: 0, rotate: 90 },
      { index: 1, rotate: 0 },
    ]);
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0]);
  });
  it('can repeat a page', async () => {
    const out = await organisePdf(await makePdf(2), [
      { index: 1, rotate: 0 },
      { index: 1, rotate: 0 },
    ]);
    expect(await pageWidths(out.bytes)).toEqual([2, 2].map(widthOfPage));
  });
  it('refuses to produce an empty document', async () => {
    await expect(organisePdf(await makePdf(2), [])).rejects.toThrow(/at least one page/);
  });
  it('rejects pages outside the document and odd angles', async () => {
    await expect(organisePdf(await makePdf(2), [{ index: 5, rotate: 0 }])).rejects.toThrow(/Page 6 does not exist/);
    await expect(organisePdf(await makePdf(2), [{ index: 0, rotate: 45 }])).rejects.toThrow(/steps of 90/);
  });
});
