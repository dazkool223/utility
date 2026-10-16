import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './logic';

describe('Base64', () => {
  it('encodes ASCII and UTF-8', () => {
    expect(encodeBase64('hello', false)).toBe('aGVsbG8=');
    expect(encodeBase64('héllo ✓', false)).toBe('aMOpbGxvIOKckw==');
  });
  it('encodes URL-safe without padding', () => {
    expect(encodeBase64('??>>', false)).toBe('Pz8+Pg==');
    expect(encodeBase64('??>>', true)).toBe('Pz8-Pg');
  });
  it('round-trips', () => {
    const s = '{"a":"✓"}\n\t🙂';
    expect(decodeBase64(encodeBase64(s, false))).toBe(s);
    expect(decodeBase64(encodeBase64(s, true))).toBe(s);
  });
  it('decodes with whitespace and missing padding', () => {
    expect(decodeBase64('aGVs\nbG8')).toBe('hello');
  });
  it('rejects invalid characters', () => {
    expect(() => decodeBase64('abc$')).toThrow(/Not valid Base64/);
  });
  it('rejects impossible length', () => {
    expect(() => decodeBase64('abcde')).toThrow(/length/);
  });
  it('rejects non-UTF-8 bytes', () => {
    expect(() => decodeBase64('/w==')).toThrow(/UTF-8/);
  });
  it('handles large input', () => {
    const big = 'x'.repeat(1_000_000);
    expect(decodeBase64(encodeBase64(big, false))).toBe(big);
  });
});
