import { describe, expect, it } from 'vitest';
import { stringifyText, unstringifyText } from './logic';

describe('JSON escape', () => {
  it('escapes quotes, newlines and backslashes', () => {
    expect(stringifyText('a "b"\nc\\d', false)).toBe('"a \\"b\\"\\nc\\\\d"');
  });
  it('can escape non-ASCII', () => {
    expect(stringifyText('é✓', true)).toBe('"\\u00e9\\u2713"');
    expect(stringifyText('é✓', false)).toBe('"é✓"');
  });
  it('round-trips a JSON document', () => {
    const doc = '{\n  "a": [1, "x"]\n}';
    expect(unstringifyText(stringifyText(doc, false))).toBe(doc);
  });
  it('unescapes with or without quotes', () => {
    expect(unstringifyText('"a\\tb"')).toBe('a\tb');
    expect(unstringifyText('a\\nb')).toBe('a\nb');
    expect(unstringifyText('say \\"hi\\"')).toBe('say "hi"');
  });
  it('handles empty string and surrogate pairs', () => {
    expect(stringifyText('', false)).toBe('""');
    expect(unstringifyText(stringifyText('🙂', true))).toBe('🙂');
  });
  it('rejects bad escapes', () => {
    expect(() => unstringifyText('"\\q"')).toThrow(/Not a valid JSON string/);
  });
  it('handles large input', () => {
    const s = 'line\n'.repeat(200_000);
    expect(unstringifyText(stringifyText(s, false))).toBe(s);
  });
});
