import { describe as d, expect, it } from 'vitest';
import { childPath, countNodes, describe } from './logic';

d('tree helpers', () => {
  it('builds dotted and indexed paths', () => {
    expect(childPath(childPath('$', 'a'), 0)).toBe('$.a[0]');
  });
  it('bracket-quotes awkward keys', () => {
    expect(childPath('$', 'my key')).toBe('$["my key"]');
    expect(childPath('$', 'é')).toBe('$["é"]');
    expect(childPath('$', '')).toBe('$[""]');
  });
  it('summarises containers and scalars', () => {
    expect(describe([1, 2])).toBe('[2]');
    expect(describe({ a: 1 })).toBe('{1}');
    expect(describe('x')).toBe('"x"');
    expect(describe(null)).toBe('null');
  });
  it('counts nodes in a large document', () => {
    expect(countNodes({ a: [1, 2], b: { c: 3 } })).toBe(6);
    expect(countNodes(Array.from({ length: 100_000 }, (_, i) => i))).toBe(100_001);
  });
});
