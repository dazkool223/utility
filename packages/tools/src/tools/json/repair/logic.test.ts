import { describe, expect, it } from 'vitest';
import { repairJson } from './logic';

describe('repairJson', () => {
  it('fixes single quotes, unquoted keys and trailing commas', () => {
    expect(JSON.parse(repairJson("{a: 'x', b: [1,2,],}", 0))).toEqual({ a: 'x', b: [1, 2] });
  });
  it('strips comments', () => {
    expect(JSON.parse(repairJson('{/* c */"a":1 // d\n}', 2))).toEqual({ a: 1 });
  });
  it('closes truncated input', () => {
    expect(JSON.parse(repairJson('{"a":[1,2', 2))).toEqual({ a: [1, 2] });
  });
  it('pretty-prints when asked', () => {
    expect(repairJson("{'a':1}", 2)).toBe('{\n  "a": 1\n}');
  });
  it('keeps unicode', () => {
    expect(JSON.parse(repairJson("{'k':'é✓'}", 2))).toEqual({ k: 'é✓' });
  });
  it('explains unrepairable input', () => {
    expect(() => repairJson('{"a" 1 2 ]]', 2)).toThrow(/could not be repaired/);
  });
  it('handles large input', () => {
    const big = '[' + Array.from({ length: 100_000 }, (_, i) => `{a:${i}}`).join(',') + ',]';
    expect(JSON.parse(repairJson(big, 0))).toHaveLength(100_000);
  });
});
