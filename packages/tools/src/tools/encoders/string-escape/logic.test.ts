import { describe, expect, it } from 'vitest';
import { escapeString, unescapeString } from './logic';

describe('escapeString', () => {
  it('escapes JavaScript strings', () => {
    expect(escapeString('a "b" \'c\'\n\t\\', 'js')).toBe('a \\"b\\" \\\'c\\\'\\n\\t\\\\');
    expect(escapeString('\x01\v', 'js')).toBe('\\x01\\v');
  });
  it('escapes JSON strings', () => {
    expect(escapeString('say "hi"\n\x01', 'json')).toBe('say \\"hi\\"\\n\\u0001');
    expect(escapeString("it's", 'json')).toBe("it's");
  });
  it('escapes Java and C#', () => {
    expect(escapeString('a\tb\x01', 'java')).toBe('a\\tb\\u0001');
    expect(escapeString('\v\\', 'csharp')).toBe('\\v\\\\');
  });
  it('can escape non-ASCII as unicode escapes', () => {
    expect(escapeString('é✓🙂', 'java', true)).toBe('\\u00e9\\u2713\\ud83d\\ude42');
    expect(escapeString('é', 'java', false)).toBe('é');
  });
  it('escapes SQL, XML and CSV', () => {
    expect(escapeString("O'Brien", 'sql')).toBe("O''Brien");
    expect(escapeString(`<a href="x">T&C's</a>`, 'xml')).toBe('&lt;a href=&quot;x&quot;&gt;T&amp;C&apos;s&lt;/a&gt;');
    expect(escapeString('a,b "c"', 'csv')).toBe('"a,b ""c"""');
    expect(escapeString('plain', 'csv')).toBe('plain');
  });
  it('handles empty input', () => {
    for (const l of ['js', 'json', 'java', 'csharp', 'sql', 'xml', 'csv'] as const) expect(escapeString('', l)).toBe('');
  });
});

describe('unescapeString', () => {
  it('round-trips every language', () => {
    const s = 'line1\nline2\t"q" \'s\' \\ é✓ 🙂 <&>';
    expect(unescapeString(escapeString(s, 'js'), 'js')).toBe(s);
    expect(unescapeString(escapeString(s, 'json', true), 'json')).toBe(s.replace(/'/g, "'"));
    expect(unescapeString(escapeString(s, 'java', true), 'java')).toBe(s);
    expect(unescapeString(escapeString(s, 'csharp'), 'csharp')).toBe(s);
    expect(unescapeString(escapeString(s, 'sql'), 'sql')).toBe(s);
    expect(unescapeString(escapeString(s, 'xml'), 'xml')).toBe(s);
    expect(unescapeString(escapeString(s, 'csv'), 'csv')).toBe(s);
  });
  it('decodes hex, unicode and code point escapes', () => {
    expect(unescapeString('\\x41\\u0042\\u{1F642}', 'js')).toBe('AB🙂');
    expect(unescapeString('\\ud83d\\ude42', 'java')).toBe('🙂');
    expect(unescapeString('\\101', 'java')).toBe('A');
  });
  it('decodes XML numeric and named entities', () => {
    expect(unescapeString('&#65;&#x42;&lt;&unknown;', 'xml')).toBe('AB<&unknown;');
  });
  it('is lenient in JavaScript but strict elsewhere', () => {
    expect(unescapeString('\\q', 'js')).toBe('q');
    expect(() => unescapeString('\\q', 'json')).toThrow(/Unknown escape/);
    expect(() => unescapeString("\\'", 'json')).toThrow(/JSON does not allow/);
  });
  it('rejects broken escapes', () => {
    expect(() => unescapeString('abc\\', 'js')).toThrow(/lone backslash/);
    expect(() => unescapeString('\\u12', 'js')).toThrow(/four hex digits/);
    expect(() => unescapeString('\\x4', 'js')).toThrow(/two hex digits/);
    expect(() => unescapeString('a"b', 'csv')).toThrow(/wrapped in quotes/);
  });
  it('handles large input', () => {
    const s = 'tab\there "q"\n'.repeat(100_000);
    expect(unescapeString(escapeString(s, 'js'), 'js')).toBe(s);
  });
});
