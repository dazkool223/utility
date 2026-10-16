import { describe, expect, it } from 'vitest';
import { buildSpec, DEFAULT_QUALITY, defaultOptions, hasLosslessMode, hasQuality, uniqueNames } from './logic';

describe('buildSpec', () => {
  it('maps each format to an encoder request', () => {
    expect(buildSpec({ ...defaultOptions, format: 'png' })).toEqual({ format: 'png' });
    expect(buildSpec({ ...defaultOptions, format: 'qoi' })).toEqual({ format: 'qoi' });
    expect(buildSpec({ ...defaultOptions, format: 'jpeg', quality: 70.4, background: '#000000' })).toEqual({ format: 'jpeg', quality: 70, background: [0, 0, 0] });
    expect(buildSpec({ ...defaultOptions, format: 'webp', quality: 90, lossless: true })).toEqual({ format: 'webp', quality: 90, lossless: true });
    expect(buildSpec({ ...defaultOptions, format: 'avif', quality: 40, avifSpeed: 8 })).toEqual({ format: 'avif', quality: 40, lossless: false, speed: 8 });
    expect(buildSpec({ ...defaultOptions, format: 'jxl', quality: 60 })).toEqual({ format: 'jxl', quality: 60, lossless: false });
  });

  it('rejects quality outside 1-100 and non-numbers', () => {
    expect(() => buildSpec({ ...defaultOptions, quality: 0 })).toThrow(/between 1 and 100/);
    expect(() => buildSpec({ ...defaultOptions, quality: 101 })).toThrow(/between 1 and 100/);
    expect(() => buildSpec({ ...defaultOptions, quality: NaN })).toThrow(/between 1 and 100/);
  });

  it('falls back to a white background for an invalid colour', () => {
    expect(buildSpec({ ...defaultOptions, format: 'jpeg', background: 'oops' })).toMatchObject({ background: [255, 255, 255] });
  });
});

describe('option helpers', () => {
  it('knows which formats take quality and lossless mode', () => {
    expect(hasQuality('png', false)).toBe(false);
    expect(hasQuality('qoi', false)).toBe(false);
    expect(hasQuality('jpeg', false)).toBe(true);
    expect(hasQuality('webp', false)).toBe(true);
    expect(hasQuality('webp', true)).toBe(false);
    expect(hasLosslessMode('avif')).toBe(true);
    expect(hasLosslessMode('jpeg')).toBe(false);
  });

  it('has a default quality for every format', () => {
    for (const f of ['png', 'jpeg', 'webp', 'avif', 'jxl', 'qoi'] as const) expect(DEFAULT_QUALITY[f]).toBeGreaterThan(0);
  });
});

describe('uniqueNames', () => {
  it('leaves distinct names alone and numbers repeats', () => {
    expect(uniqueNames(['a.png', 'b.png'])).toEqual(['a.png', 'b.png']);
    expect(uniqueNames(['a.png', 'a.png', 'a.png', 'noext', 'noext'])).toEqual(['a.png', 'a-2.png', 'a-3.png', 'noext', 'noext-2']);
    expect(uniqueNames([])).toEqual([]);
  });
});
