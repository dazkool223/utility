import { describe, expect, it } from 'vitest';
import { diffJson, formatChanges } from './logic';

const f = (a: string, b: string) => formatChanges(diffJson(a, b));

describe('diffJson', () => {
  it('reports no differences for equal documents regardless of key order', () => {
    expect(f('{"a":1,"b":2}', '{"b":2,"a":1}')).toBe('No differences');
  });
  it('reports added, removed and changed values with paths', () => {
    expect(f('{"a":1,"b":2}', '{"a":3,"c":4}')).toBe('~ $.a: 1 -> 3\n- $.b: 2\n+ $.c: 4');
  });
  it('handles nested objects and arrays', () => {
    const out = f('{"x":{"y":[1,2,3]}}', '{"x":{"y":[1,5,3,4]}}');
    expect(out).toContain('$.x.y[1]');
    expect(out).toContain('+ $.x.y[3]: 4');
  });
  it('detects removed array items', () => {
    expect(f('[1,2,3]', '[1,3]')).toContain('- $[');
  });
  it('treats an empty side as all added or removed', () => {
    expect(f('{"a":1}', '')).toBe('- $: {"a":1}');
    expect(f('', '[1]')).toBe('+ $: [1]');
  });
  it('handles unicode and type changes', () => {
    expect(f('{"k":"é"}', '{"k":["é"]}')).toContain('$.k');
  });
  it('rejects invalid JSON', () => {
    expect(() => diffJson('{', '{}')).toThrow(/Invalid JSON/);
  });
  it('handles large documents', () => {
    const a = JSON.stringify(Array.from({ length: 20_000 }, (_, i) => ({ i })));
    const b = JSON.stringify(Array.from({ length: 20_000 }, (_, i) => ({ i: i === 500 ? -1 : i })));
    expect(diffJson(a, b)).toHaveLength(1);
  });
});
