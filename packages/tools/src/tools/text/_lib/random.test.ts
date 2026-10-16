import { describe, expect, it } from 'vitest';
import { randomInt, shuffled } from './random';

describe('randomInt', () => {
  it('stays in range and covers it', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = randomInt(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });
  it('handles 1 and rejects invalid ranges', () => {
    expect(randomInt(1)).toBe(0);
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(1.5)).toThrow();
  });
});

describe('shuffled', () => {
  it('keeps every item exactly once and does not mutate', () => {
    const src = Array.from({ length: 100 }, (_, i) => i);
    const out = shuffled(src);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
    expect(src[0]).toBe(0);
  });
  it('handles empty and single arrays', () => {
    expect(shuffled([])).toEqual([]);
    expect(shuffled([1])).toEqual([1]);
  });
  it('is deterministic with a fixed rand', () => {
    expect(shuffled([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
