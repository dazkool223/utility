import { describe, expect, it } from 'vitest';
import { jsonToToml, tomlToJson } from './logic';

describe('tomlToJson', () => {
  it('converts tables, arrays and scalars', () => {
    const toml = 'title = "x"\nn = 5\nf = 1.5\nok = true\narr = [1, 2]\n\n[owner]\nname = "Ada"\n\n[[items]]\nid = 1\n\n[[items]]\nid = 2';
    expect(JSON.parse(tomlToJson(toml))).toEqual({ title: 'x', n: 5, f: 1.5, ok: true, arr: [1, 2], owner: { name: 'Ada' }, items: [{ id: 1 }, { id: 2 }] });
  });
  it('converts dates to ISO strings and keeps unicode', () => {
    expect(JSON.parse(tomlToJson('d = 1979-05-27T07:32:00Z\ns = "é✓"'))).toEqual({ d: '1979-05-27T07:32:00.000Z', s: 'é✓' });
  });
  it('reports the line of a syntax error', () => {
    expect(() => tomlToJson('a = 1\nb = ')).toThrow(/Invalid TOML.*line 2/);
  });
  it('rejects duplicate keys', () => {
    expect(() => tomlToJson('a = 1\na = 2')).toThrow(/line 2/);
  });
  it('handles empty and large input', () => {
    expect(tomlToJson('')).toBe('{}');
    const big = Array.from({ length: 30_000 }, (_, i) => `k${i} = ${i}`).join('\n');
    expect(Object.keys(JSON.parse(tomlToJson(big)))).toHaveLength(30_000);
  });
});

describe('jsonToToml', () => {
  it('converts nested objects and arrays of tables', () => {
    const toml = jsonToToml('{"title":"x","owner":{"name":"Ada"},"items":[{"id":1},{"id":2}]}');
    expect(toml).toContain('title = "x"');
    expect(toml).toContain('[owner]');
    expect(toml).toContain('[[items]]');
  });
  it('round-trips', () => {
    const json = '{"a":1,"b":{"c":[1,2,3]},"s":"é"}';
    expect(JSON.parse(tomlToJson(jsonToToml(json)))).toEqual(JSON.parse(json));
  });
  it('rejects null, arrays at the root and invalid JSON', () => {
    expect(() => jsonToToml('{"a":{"b":null}}')).toThrow(/null at [$]\.a\.b/);
    expect(() => jsonToToml('[1]')).toThrow(/top level/);
    expect(() => jsonToToml('{')).toThrow(/Invalid JSON/);
  });
});
