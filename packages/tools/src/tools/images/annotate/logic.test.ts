import { describe, expect, it } from 'vitest';
import { annotatedName, annotationBounds, defaultFontSize, describeAnnotation, newAnnotation, tileOrigins, validateAnnotation, type Annotation } from './logic';

describe('newAnnotation', () => {
  it('places text near the top-left with a size relative to the picture', () => {
    const a = newAnnotation('text', 1, 2000, 1000);
    expect(a).toMatchObject({ kind: 'text', x: 100, y: 50, size: 100 });
  });
  it('puts areas in the middle, inside the picture', () => {
    const a = newAnnotation('pixelate', 2, 1000, 500);
    expect(a.kind === 'pixelate' && a.rect).toEqual({ x: 300, y: 175, w: 400, h: 150 });
    const b = newAnnotation('redact', 3, 10, 10);
    expect(b.kind === 'redact' && b.rect.w).toBeGreaterThan(0);
  });
  it('has a minimum font size', () => expect(defaultFontSize(100)).toBe(12));
});

describe('validateAnnotation', () => {
  const text = newAnnotation('text', 1, 1000, 1000) as Extract<Annotation, { kind: 'text' }>;
  it('accepts the defaults', () => {
    for (const k of ['text', 'watermark', 'pixelate', 'redact'] as const) expect(() => validateAnnotation(newAnnotation(k, 1, 1000, 1000), 1000, 1000)).not.toThrow();
  });
  it('rejects empty text and silly sizes', () => {
    expect(() => validateAnnotation({ ...text, text: '  ' }, 1000, 1000)).toThrow(/needs some text/);
    expect(() => validateAnnotation({ ...text, size: 1 }, 1000, 1000)).toThrow(/between 4 and 2000/);
    expect(() => validateAnnotation({ ...text, opacity: 0 }, 1000, 1000)).toThrow(/Opacity/);
  });
  it('rejects areas outside the picture', () => {
    const p = newAnnotation('pixelate', 1, 1000, 1000);
    if (p.kind !== 'pixelate') throw new Error('unreachable');
    expect(() => validateAnnotation({ ...p, rect: { x: 2000, y: 0, w: 10, h: 10 } }, 1000, 1000)).toThrow(/outside the picture/);
    expect(() => validateAnnotation({ ...p, block: 1 }, 1000, 1000)).toThrow(/block size/);
  });
  it('rejects a watermark angle out of range', () => {
    const w = newAnnotation('watermark', 1, 1000, 1000);
    expect(() => validateAnnotation({ ...w, angle: 120 } as Annotation, 1000, 1000)).toThrow(/angle/);
  });
});

describe('describeAnnotation / annotationBounds', () => {
  it('shortens long text', () => {
    const t = { ...(newAnnotation('text', 1, 1000, 1000) as Extract<Annotation, { kind: 'text' }>), text: 'a'.repeat(40) };
    expect(describeAnnotation(t)).toBe(`Text: “${'a'.repeat(24)}…”`);
  });
  it('gives bounds for text and areas, none for watermarks', () => {
    expect(annotationBounds(newAnnotation('watermark', 1, 100, 100), 100, 100)).toBeNull();
    expect(annotationBounds(newAnnotation('redact', 1, 100, 100), 100, 100)).not.toBeNull();
    const t = newAnnotation('text', 1, 1000, 1000);
    const b = annotationBounds({ ...t, x: 990, y: 990 } as Annotation, 1000, 1000);
    expect(b!.x + b!.w).toBeLessThanOrEqual(1000);
  });
});

describe('tileOrigins', () => {
  it('covers the area with whole cells', () => {
    expect(tileOrigins(250, 100, 100, 50)).toHaveLength(6);
    expect(tileOrigins(250, 100, 100, 50)[5]).toEqual([200, 50]);
  });
  it('is empty for a zero-sized cell', () => expect(tileOrigins(100, 100, 0, 10)).toEqual([]));
});

describe('annotatedName', () => {
  it('adds a suffix', () => expect(annotatedName('shot.png', 'webp')).toBe('shot-annotated.webp'));
});
