import { describe, expect, it } from 'vitest';
import { jsonToYaml, yamlToJson } from './logic';

describe('JSON to YAML', () => {
  it('converts nested data', () => {
    expect(jsonToYaml('{"a":1,"b":{"c":[1,2]},"d":"x"}')).toBe('a: 1\nb:\n  c:\n    - 1\n    - 2\nd: x');
  });
  it('quotes strings that would be misread', () => {
    expect(jsonToYaml('{"a":"true","b":"1","c":""}')).toBe('a: "true"\nb: "1"\nc: ""');
  });
  it('keeps unicode and multi-line strings', () => {
    expect(jsonToYaml('{"a":"é✓"}')).toBe('a: é✓');
    expect(yamlToJson(jsonToYaml('{"a":"l1\\nl2"}'))).toBe('{\n  "a": "l1\\nl2"\n}');
  });
  it('supports 4-space indent', () => {
    expect(jsonToYaml('{"a":{"b":1}}', 4)).toBe('a:\n    b: 1');
  });
  it('rejects invalid JSON', () => {
    expect(() => jsonToYaml('{')).toThrow(/Invalid JSON/);
  });
});

describe('YAML to JSON', () => {
  it('converts mappings, lists and scalars', () => {
    expect(JSON.parse(yamlToJson('a: 1\nb: [x, y]\nc:\n  d: true\n  e: null'))).toEqual({ a: 1, b: ['x', 'y'], c: { d: true, e: null } });
  });
  it('supports anchors and aliases', () => {
    expect(JSON.parse(yamlToJson('base: &b {x: 1}\ncopy: *b'))).toEqual({ base: { x: 1 }, copy: { x: 1 } });
  });
  it('turns multiple documents into an array', () => {
    expect(JSON.parse(yamlToJson('a: 1\n---\na: 2'))).toEqual([{ a: 1 }, { a: 2 }]);
  });
  it('reports line and column for errors', () => {
    expect(() => yamlToJson('a: 1\nb: [1, 2\nc: 3')).toThrow(/Invalid YAML at line \d+, column \d+/);
  });
  it('rejects duplicate keys', () => {
    expect(() => yamlToJson('a: 1\na: 2')).toThrow(/unique/i);
  });
  it('handles empty documents and large input', () => {
    expect(yamlToJson('# only a comment')).toBe('null');
    const big = Array.from({ length: 50_000 }, (_, i) => `- id: ${i}`).join('\n');
    expect(JSON.parse(yamlToJson(big))).toHaveLength(50_000);
  });
});
