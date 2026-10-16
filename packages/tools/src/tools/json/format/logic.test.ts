import { describe, expect, it } from 'vitest';
import { formatJson, lineCol, parseJson } from './logic';

describe('formatJson', () => {
  it('pretty-prints with 2 spaces', () => {
    expect(formatJson('{"a":1,"b":[1,2]}', { indent: '2', sortKeys: false })).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  });
  it('supports 4 spaces and tabs', () => {
    expect(formatJson('{"a":1}', { indent: '4', sortKeys: false })).toBe('{\n    "a": 1\n}');
    expect(formatJson('{"a":1}', { indent: 'tab', sortKeys: false })).toBe('{\n\t"a": 1\n}');
  });
  it('sorts keys deeply', () => {
    expect(formatJson('{"b":{"d":1,"c":2},"a":0}', { indent: '2', sortKeys: true })).toBe('{\n  "a": 0,\n  "b": {\n    "c": 2,\n    "d": 1\n  }\n}');
  });
  it('keeps unicode and escapes', () => {
    expect(formatJson('["é","\\n"]', { indent: '2', sortKeys: false })).toBe('[\n  "é",\n  "\\n"\n]');
  });
  it('formats scalars', () => {
    expect(formatJson('  42 ', { indent: '2', sortKeys: false })).toBe('42');
  });
  it('reports line and column for invalid JSON', () => {
    expect(() => parseJson('{\n  "a": 1,\n}')).toThrow(/Invalid JSON at line 3, column 1/);
  });
  it('rejects empty and garbage input', () => {
    expect(() => parseJson('nope')).toThrow(/Invalid JSON/);
  });
});

describe('lineCol', () => {
  it('is 1-based', () => {
    expect(lineCol('ab\ncd', 4)).toEqual({ line: 2, column: 2 });
  });
});
