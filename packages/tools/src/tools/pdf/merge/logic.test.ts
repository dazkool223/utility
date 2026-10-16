import { describe, expect, it } from 'vitest';
import { mergePdfs } from './logic';
import { makePdf, pageWidths, widthOfPage } from '../_lib/testPdf';

describe('mergePdfs', () => {
  it('concatenates pages in input order', async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    const out = await mergePdfs([
      { name: 'a.pdf', bytes: a },
      { name: 'b.pdf', bytes: b },
    ]);
    expect(out.pageCount).toBe(5);
    expect(await pageWidths(out.bytes)).toEqual([1, 2, 1, 2, 3].map(widthOfPage));
  });
  it('honours the order the files are given in', async () => {
    const a = await makePdf(1);
    const b = await makePdf(2);
    const out = await mergePdfs([
      { name: 'b.pdf', bytes: b },
      { name: 'a.pdf', bytes: a },
    ]);
    expect(await pageWidths(out.bytes)).toEqual([1, 2, 1].map(widthOfPage));
  });
  it('can merge a file with itself', async () => {
    const a = await makePdf(2);
    const out = await mergePdfs([
      { name: 'a.pdf', bytes: a },
      { name: 'a.pdf', bytes: a },
    ]);
    expect(out.pageCount).toBe(4);
  });
  it('needs at least two files', async () => {
    await expect(mergePdfs([{ name: 'a.pdf', bytes: await makePdf(1) }])).rejects.toThrow(/at least two/);
    await expect(mergePdfs([])).rejects.toThrow(/at least two/);
  });
  it('names the broken file', async () => {
    await expect(
      mergePdfs([
        { name: 'ok.pdf', bytes: await makePdf(1) },
        { name: 'notes.pdf', bytes: new TextEncoder().encode('this is not a pdf') },
      ]),
    ).rejects.toThrow(/^notes\.pdf: /);
  });
});
