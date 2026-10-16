import { describe, expect, it } from 'vitest';
import { DEFAULT_OUTPUT, outputSpec } from './output';

describe('outputSpec', () => {
  it('keeps PNG, JPEG and WebP when set to "same"', () => {
    expect(outputSpec(DEFAULT_OUTPUT, 'jpeg')).toMatchObject({ format: 'jpeg', spec: { format: 'jpeg', quality: 85 } });
    expect(outputSpec(DEFAULT_OUTPUT, 'webp').format).toBe('webp');
    expect(outputSpec(DEFAULT_OUTPUT, 'png').spec).toEqual({ format: 'png' });
  });
  it('saves other inputs as PNG', () => {
    for (const f of ['gif', 'bmp', 'avif', 'jxl', 'qoi', 'unknown'] as const) expect(outputSpec(DEFAULT_OUTPUT, f).format).toBe('png');
  });
  it('uses an explicit format whatever the input was', () => {
    expect(outputSpec({ ...DEFAULT_OUTPUT, format: 'avif', quality: 40 }, 'png').spec).toMatchObject({ format: 'avif', quality: 40 });
  });
  it('rejects a quality out of range', () => {
    expect(() => outputSpec({ ...DEFAULT_OUTPUT, quality: 0 }, 'png')).toThrow(/between 1 and 100/);
  });
});
