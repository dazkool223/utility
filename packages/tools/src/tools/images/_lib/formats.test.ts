import { describe, expect, it } from 'vitest';
import { flattenAlpha, hasTransparency, megapixels, outputName, parseHexColour, percentSaved, resolveOutputFormat, sniffFormat } from './formats';

const bytes = (...n: number[]) => Uint8Array.from([...n, ...new Array(Math.max(0, 16 - n.length)).fill(0)]);
const text = (s: string) => new TextEncoder().encode(s);

describe('sniffFormat', () => {
  it('recognises each raster format by its magic bytes', () => {
    expect(sniffFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
    expect(sniffFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
    expect(sniffFormat(text('RIFF\0\0\0\0WEBPVP8 '))).toBe('webp');
    expect(sniffFormat(text('GIF89a\0\0\0\0\0\0'))).toBe('gif');
    expect(sniffFormat(bytes(0x42, 0x4d))).toBe('bmp');
    expect(sniffFormat(text('qoif\0\0\0\0\0\0\0\0'))).toBe('qoi');
    expect(sniffFormat(text('\0\0\0\x1cftypavif\0\0\0\0'))).toBe('avif');
    expect(sniffFormat(bytes(0xff, 0x0a))).toBe('jxl');
    expect(sniffFormat(bytes(0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a))).toBe('jxl');
  });

  it('recognises SVG text', () => {
    expect(sniffFormat(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
    expect(sniffFormat(text('<?xml version="1.0"?>\n<svg width="1"/>'))).toBe('svg');
  });

  it('does not mistake HEIC, text or tiny input for an image', () => {
    expect(sniffFormat(text('\0\0\0\x18ftypheic\0\0\0\0'))).toBe('unknown');
    expect(sniffFormat(text('just some text, nothing more'))).toBe('unknown');
    expect(sniffFormat(new Uint8Array(0))).toBe('unknown');
    expect(sniffFormat(bytes())).toBe('unknown');
  });
});

describe('outputName', () => {
  it('swaps the extension and adds an optional suffix', () => {
    expect(outputName('photo.jpeg', 'webp')).toBe('photo.webp');
    expect(outputName('my.holiday.photo.png', 'jpg', '-small')).toBe('my.holiday.photo-small.jpg');
    expect(outputName('noext', 'png')).toBe('noext.png');
    expect(outputName('', 'png')).toBe('image.png');
  });
});

describe('resolveOutputFormat', () => {
  it('keeps an explicit choice and maps "same" to a writable format', () => {
    expect(resolveOutputFormat('avif', 'png')).toBe('avif');
    expect(resolveOutputFormat('same', 'jpeg')).toBe('jpeg');
    expect(resolveOutputFormat('same', 'webp')).toBe('webp');
    expect(resolveOutputFormat('same', 'gif')).toBe('png');
    expect(resolveOutputFormat('same', 'jxl')).toBe('png');
  });
});

describe('alpha helpers', () => {
  it('detects transparency', () => {
    expect(hasTransparency({ data: new Uint8ClampedArray([1, 2, 3, 255]), width: 1, height: 1 })).toBe(false);
    expect(hasTransparency({ data: new Uint8ClampedArray([1, 2, 3, 254]), width: 1, height: 1 })).toBe(true);
  });

  it('flattens onto a background', () => {
    const out = flattenAlpha({ data: new Uint8ClampedArray([0, 0, 0, 0, 100, 100, 100, 128]), width: 2, height: 1 }, [255, 255, 255]);
    expect(Array.from(out.data.subarray(0, 4))).toEqual([255, 255, 255, 255]);
    expect(out.data[4]).toBeGreaterThan(170);
    expect(out.data[4]).toBeLessThan(180);
    expect(out.data[7]).toBe(255);
  });
});

describe('small helpers', () => {
  it('parses hex colours and defaults to white', () => {
    expect(parseHexColour('#ff8000')).toEqual([255, 128, 0]);
    expect(parseHexColour('00ff00')).toEqual([0, 255, 0]);
    expect(parseHexColour('nope')).toEqual([255, 255, 255]);
    expect(parseHexColour('#fff')).toEqual([255, 255, 255]);
  });

  it('computes percent saved', () => {
    expect(percentSaved(1000, 250)).toBe(75);
    expect(percentSaved(1000, 1200)).toBe(-20);
    expect(percentSaved(0, 5)).toBe(0);
    expect(percentSaved(3, 2)).toBe(33.3);
  });

  it('computes megapixels', () => {
    expect(megapixels(4000, 3000)).toBe(12);
  });
});
