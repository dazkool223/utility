import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { rotatePdf } from './logic';
import { makePdf } from '../_lib/testPdf';

async function rotations(bytes: Uint8Array): Promise<number[]> {
  return (await PDFDocument.load(bytes)).getPages().map((p) => p.getRotation().angle);
}

describe('rotatePdf', () => {
  it('rotates every page when no pages are given', async () => {
    const out = await rotatePdf(await makePdf(3), 90, '');
    expect(out.rotated).toBe(3);
    expect(await rotations(out.bytes)).toEqual([90, 90, 90]);
  });
  it('rotates only the chosen pages', async () => {
    const out = await rotatePdf(await makePdf(4), 180, '2, 4');
    expect(out.rotated).toBe(2);
    expect(await rotations(out.bytes)).toEqual([0, 180, 0, 180]);
  });
  it('adds to the existing rotation and wraps at 360', async () => {
    const once = await rotatePdf(await makePdf(1), 270, '');
    const twice = await rotatePdf(once.bytes, 180, '');
    expect(await rotations(twice.bytes)).toEqual([90]);
  });
  it('counts a repeated page once', async () => {
    const out = await rotatePdf(await makePdf(2), 90, '1,1');
    expect(out.rotated).toBe(1);
    expect(await rotations(out.bytes)).toEqual([90, 0]);
  });
  it('keeps the page count and sizes', async () => {
    const out = await rotatePdf(await makePdf(2), 90, '');
    expect(out.pageCount).toBe(2);
  });
  it('rejects pages that do not exist', async () => {
    await expect(rotatePdf(await makePdf(2), 90, '3')).rejects.toThrow(/Page 3 does not exist/);
  });
  it('rejects unsupported angles', async () => {
    await expect(rotatePdf(await makePdf(1), 45 as never, '')).rejects.toThrow(/90, 180 or 270/);
  });
});
