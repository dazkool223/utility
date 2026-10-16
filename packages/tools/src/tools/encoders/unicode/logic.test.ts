import { describe, expect, it } from 'vitest';
import { escapeUnicode, listCodePoints, unescapeUnicode } from './logic';

describe('escapeUnicode', () => {
  it('escapes every character as \\uXXXX, using surrogate pairs above the BMP', () => {
    expect(escapeUnicode('Aé🙂', 'u4', false)).toBe('\\u0041\\u00E9\\uD83D\\uDE42');
  });
  it('can leave ASCII alone', () => {
    expect(escapeUnicode('Aé', 'u4', true)).toBe('A\\u00E9');
  });
  it('supports ES6 braces, HTML and code point lists', () => {
    expect(escapeUnicode('é🙂', 'braces', false)).toBe('\\u{E9}\\u{1F642}');
    expect(escapeUnicode('é🙂', 'html', false)).toBe('&#xE9;&#x1F642;');
    expect(escapeUnicode('Aé🙂', 'codepoints', false)).toBe('U+0041 U+00E9 U+1F642');
  });
  it('handles empty input', () => {
    expect(escapeUnicode('', 'u4', false)).toBe('');
  });
});

describe('unescapeUnicode', () => {
  it('decodes every supported notation', () => {
    expect(unescapeUnicode('\\u0041\\uD83D\\uDE42')).toBe('A🙂');
    expect(unescapeUnicode('\\u{1F642} \\U0001F642')).toBe('🙂 🙂');
    expect(unescapeUnicode('U+0041 U+1F642')).toBe('A🙂');
    expect(unescapeUnicode('&#x41;&#66;')).toBe('AB');
  });
  it('leaves other text untouched', () => {
    expect(unescapeUnicode('plain \\n text')).toBe('plain \\n text');
  });
  it('round-trips', () => {
    const s = 'héllo ✓ 🙂 𝒳';
    for (const f of ['u4', 'braces', 'codepoints', 'html'] as const) expect(unescapeUnicode(escapeUnicode(s, f, false))).toBe(s);
  });
  it('rejects out-of-range code points', () => {
    expect(() => unescapeUnicode('\\u{110000}')).toThrow(/not a valid Unicode code point/);
    expect(() => unescapeUnicode('&#99999999;')).toThrow(/not a valid/);
  });
  it('handles large input', () => {
    const s = 'a✓🙂'.repeat(100_000);
    expect(unescapeUnicode(escapeUnicode(s, 'u4', false))).toBe(s);
  });
});

describe('listCodePoints', () => {
  it('lists each code point with UTF-8 bytes', () => {
    expect(listCodePoints('A é')).toBe('U+0041  A  UTF-8: 41\nU+0020  (space)  UTF-8: 20\nU+00E9  é  UTF-8: c3 a9');
  });
});
