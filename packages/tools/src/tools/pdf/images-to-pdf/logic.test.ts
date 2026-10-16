import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { imagesToPdf, placeImage, PAGE_POINTS } from './logic';
import { detectImageType } from './imageType';

// A 1x1 red PNG.
const PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
// A 1x1 white JPEG.
const JPEG = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64',
  ),
);

const fit = { pageSize: 'fit', orientation: 'auto', margin: 0 } as const;

describe('detectImageType', () => {
  it('recognises PNG and JPEG by magic bytes', () => {
    expect(detectImageType(PNG)).toBe('png');
    expect(detectImageType(JPEG)).toBe('jpeg');
  });
  it('returns null for other data', () => {
    expect(detectImageType(new TextEncoder().encode('GIF89a'))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe('placeImage', () => {
  it('makes the page the size of the image at 96 dpi', () => {
    const p = placeImage(960, 480, fit);
    expect([p.pageWidth, p.pageHeight, p.width, p.height]).toEqual([720, 360, 720, 360]);
  });
  it('centres and scales an image on A4 with margins', () => {
    const p = placeImage(1000, 1000, { pageSize: 'a4', orientation: 'auto', margin: 50 });
    const [w, h] = PAGE_POINTS.a4;
    expect(p.pageWidth).toBeCloseTo(w);
    expect(p.pageHeight).toBeCloseTo(h);
    expect(p.width).toBeCloseTo(w - 100);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo((h - p.height) / 2);
  });
  it('turns the page sideways for wide images when orientation is auto', () => {
    const p = placeImage(2000, 1000, { pageSize: 'letter', orientation: 'auto', margin: 0 });
    expect(p.pageWidth).toBe(792);
    expect(p.pageHeight).toBe(612);
  });
  it('forces portrait or landscape when asked', () => {
    expect(placeImage(2000, 1000, { pageSize: 'a4', orientation: 'portrait', margin: 0 }).pageWidth).toBeCloseTo(595.28);
    expect(placeImage(1000, 2000, { pageSize: 'a4', orientation: 'landscape', margin: 0 }).pageWidth).toBeCloseTo(841.89);
  });
  it('clamps absurd margins so the image stays visible', () => {
    const p = placeImage(100, 100, { pageSize: 'a4', orientation: 'auto', margin: 10_000 });
    expect(p.width).toBeGreaterThan(0);
  });
});

describe('imagesToPdf', () => {
  it('makes one page per image, in order', async () => {
    const out = await imagesToPdf(
      [
        { name: 'a.png', bytes: PNG },
        { name: 'b.jpg', bytes: JPEG },
      ],
      fit,
    );
    expect(out.pageCount).toBe(2);
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPageCount()).toBe(2);
  });
  it('accepts ArrayBuffers', async () => {
    const out = await imagesToPdf([{ name: 'a.png', bytes: PNG.buffer.slice(PNG.byteOffset, PNG.byteOffset + PNG.byteLength) as ArrayBuffer }], fit);
    expect(out.pageCount).toBe(1);
  });
  it('uses fixed page sizes', async () => {
    const out = await imagesToPdf([{ name: 'a.png', bytes: PNG }], { pageSize: 'a4', orientation: 'portrait', margin: 20 });
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
  });
  it('rejects an empty list', async () => {
    await expect(imagesToPdf([], fit)).rejects.toThrow(/at least one image/);
  });
  it('names formats it cannot embed', async () => {
    await expect(imagesToPdf([{ name: 'pic.gif', bytes: new TextEncoder().encode('GIF89a....') }], fit)).rejects.toThrow(/pic\.gif: only JPEG and PNG/);
  });
  it('names damaged images', async () => {
    const broken = PNG.slice(0, 20);
    await expect(imagesToPdf([{ name: 'bad.png', bytes: broken }], fit)).rejects.toThrow(/bad\.png: this image could not be read/);
  });
});
