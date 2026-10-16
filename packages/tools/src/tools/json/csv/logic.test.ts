import { describe, expect, it } from 'vitest';
import { csvToJson, jsonToCsv } from './logic';

describe('jsonToCsv', () => {
  it('converts an array of objects', () => {
    expect(jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]', ',')).toBe('a,b\n1,x\n2,y');
  });
  it('flattens nested objects and unions headers', () => {
    expect(jsonToCsv('[{"a":{"b":1}},{"c":true}]', ',')).toBe('a.b,c\n1,\n,true');
  });
  it('quotes cells containing delimiters, quotes and newlines', () => {
    expect(jsonToCsv('[{"a":"x,y","b":"he said \\"hi\\"","c":"l1\\nl2"}]', ',')).toBe('a,b,c\n"x,y","he said ""hi""","l1\nl2"');
  });
  it('serialises arrays as JSON cells', () => {
    expect(jsonToCsv('[{"t":[1,2]}]', ';')).toBe('t\n[1,2]');
  });
  it('handles a single object, unicode and other delimiters', () => {
    expect(jsonToCsv('{"n":"é"}', '\t')).toBe('n\né');
  });
  it('handles arrays of arrays', () => {
    expect(jsonToCsv('[[1,2],[3,4]]', ',')).toBe('1,2\n3,4');
  });
  it('rejects empty arrays and bad JSON', () => {
    expect(() => jsonToCsv('[]', ',')).toThrow(/empty/);
    expect(() => jsonToCsv('{', ',')).toThrow(/Invalid JSON/);
  });
  it('handles large input', () => {
    const rows = Array.from({ length: 50_000 }, (_, i) => ({ i, s: 'v' + i }));
    expect(jsonToCsv(JSON.stringify(rows), ',').split('\n')).toHaveLength(50_001);
  });
});

describe('csvToJson', () => {
  const o = { types: true, unflatten: false };
  it('parses with types', () => {
    expect(JSON.parse(csvToJson('a,b\n1,x\n2,y', 'auto', o))).toEqual([
      { a: 1, b: 'x' },
      { a: 2, b: 'y' },
    ]);
  });
  it('keeps strings when types are off', () => {
    expect(JSON.parse(csvToJson('a\n1', ',', { types: false, unflatten: false }))).toEqual([{ a: '1' }]);
  });
  it('handles quoted fields and unicode', () => {
    expect(JSON.parse(csvToJson('a,b\n"x,y","é ""q"""', ',', o))).toEqual([{ a: 'x,y', b: 'é "q"' }]);
  });
  it('unflattens dotted headers', () => {
    expect(JSON.parse(csvToJson('a.b,c\n1,2', ',', { types: true, unflatten: true }))).toEqual([{ a: { b: 1 }, c: 2 }]);
  });
  it('round-trips', () => {
    const csv = jsonToCsv('[{"a":1,"b":"x"}]', ',');
    expect(JSON.parse(csvToJson(csv, ',', o))).toEqual([{ a: 1, b: 'x' }]);
  });
  it('reports malformed quotes', () => {
    expect(() => csvToJson('a,b\n"x,1', ',', o)).toThrow(/CSV problem/);
  });
  it('returns an empty array for empty data', () => {
    expect(csvToJson('a,b', ',', o)).toBe('[]');
  });
});
