import { describe, expect, it } from 'vitest';
import { minifyJson } from './logic';

describe('minifyJson', () => {
  it('removes whitespace', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": [ 1, 2 ]\n}')).toBe('{"a":1,"b":[1,2]}');
  });
  it('keeps strings and unicode intact', () => {
    expect(minifyJson('{ "k" : "a  b é ✓" }')).toBe('{"k":"a  b é ✓"}');
  });
  it('handles empty containers', () => {
    expect(minifyJson('[ ]')).toBe('[]');
    expect(minifyJson('{ }')).toBe('{}');
  });
  it('rejects malformed input with a position', () => {
    expect(() => minifyJson('{"a":')).toThrow(/Invalid JSON/);
    expect(() => minifyJson('')).toThrow(/Invalid JSON/);
  });
  it('handles large input', () => {
    const big = JSON.stringify(Array.from({ length: 100_000 }, (_, i) => ({ i })), null, 2);
    expect(minifyJson(big).length).toBeLessThan(big.length);
  });
});
