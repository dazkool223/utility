import { describe, expect, it } from 'vitest';
import { validateJson } from './logic';

describe('validateJson', () => {
  it('reports a valid object', () => {
    const r = validateJson('{"a":{"b":[1,2]},"c":true}');
    expect(r).toContain('Valid JSON');
    expect(r).toContain('Type: object');
    expect(r).toContain('Keys: 2');
    expect(r).toContain('Depth: 3');
  });
  it('reports arrays and scalars', () => {
    expect(validateJson('[1,2,3]')).toContain('Items: 3');
    expect(validateJson('"é"')).toContain('Type: string');
  });
  it('points at the error with line, column and a caret', () => {
    expect(() => validateJson('{\n  "a": 1,\n}')).toThrow(/line 3, column 1[\s\S]*3 \| }/);
  });
  it('rejects empty and trailing commas', () => {
    expect(() => validateJson('')).toThrow(/Invalid JSON/);
    expect(() => validateJson('[1,2,]')).toThrow(/Invalid JSON/);
  });
  it('handles large input', () => {
    expect(validateJson(JSON.stringify(Array.from({ length: 200_000 }, (_, i) => i)))).toContain('Items: 200000');
  });
});
