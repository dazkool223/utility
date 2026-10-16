import { describe, expect, it } from 'vitest';
import { compressedName, compressSpec, DEFAULT_COMPRESS, needsDownscale, outcome } from './logic';

describe('compressSpec', () => {
  it('recompresses PNG losslessly with the chosen level', () => {
    expect(compressSpec(DEFAULT_COMPRESS, 'png')).toEqual({ format: 'png', spec: { format: 'png', optimise: 3 } });
    expect(compressSpec({ ...DEFAULT_COMPRESS, pngLevel: 99 }, 'png').spec).toEqual({ format: 'png', optimise: 6 });
  });
  it('uses quality for JPEG and WebP and keeps their format', () => {
    expect(compressSpec(DEFAULT_COMPRESS, 'jpeg')).toMatchObject({ format: 'jpeg', spec: { format: 'jpeg', quality: 75 } });
    expect(compressSpec(DEFAULT_COMPRESS, 'webp')).toMatchObject({ format: 'webp', spec: { format: 'webp', quality: 75 } });
  });
  it('can switch format', () => {
    const o = { ...DEFAULT_COMPRESS, output: { ...DEFAULT_COMPRESS.output, format: 'avif' as const, quality: 40 } };
    expect(compressSpec(o, 'png')).toMatchObject({ format: 'avif', spec: { format: 'avif', quality: 40 } });
  });
  it('turns formats it cannot write into PNG', () => {
    expect(compressSpec(DEFAULT_COMPRESS, 'gif').format).toBe('png');
  });
});

describe('needsDownscale', () => {
  it('only when the longest side is over the limit', () => {
    expect(needsDownscale(4000, 3000, 2560)).toBe(true);
    expect(needsDownscale(2560, 3000, 2560)).toBe(true);
    expect(needsDownscale(2000, 1000, 2560)).toBe(false);
    expect(needsDownscale(4000, 3000, null)).toBe(false);
  });
});

describe('outcome', () => {
  it('reports smaller, larger and unchanged', () => {
    expect(outcome(1000, 400)).toEqual({ kind: 'smaller', percent: 60 });
    expect(outcome(1000, 1200)).toEqual({ kind: 'larger', percent: 20 });
    expect(outcome(1000, 1000)).toEqual({ kind: 'same' });
    expect(outcome(0, 10)).toEqual({ kind: 'same' });
  });
});

describe('compressedName', () => {
  it('adds a suffix and the new extension', () => {
    expect(compressedName('photo.final.jpeg', 'webp')).toBe('photo.final-compressed.webp');
    expect(compressedName('', 'png')).toBe('image-compressed.png');
  });
});
