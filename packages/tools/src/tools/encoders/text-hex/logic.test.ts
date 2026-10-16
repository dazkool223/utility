import { describe, expect, it } from 'vitest';
import { hexdump, hexToText, textToHex } from './logic';

const o = { separator: 'space', uppercase: false } as const;

describe('text <-> hex', () => {
  it('encodes with each separator', () => {
    expect(textToHex('Hello', o)).toBe('48 65 6c 6c 6f');
    expect(textToHex('Hi', { ...o, separator: 'none', uppercase: true })).toBe('4869');
    expect(textToHex('Hi', { ...o, separator: 'colon' })).toBe('48:69');
    expect(textToHex('Hi', { ...o, separator: '0x' })).toBe('0x48 0x69');
  });
  it('encodes UTF-8', () => {
    expect(textToHex('é🙂', { ...o, separator: 'none' })).toBe('c3a9f09f9982');
  });
  it('decodes common hex notations', () => {
    expect(hexToText('48 65 6c 6c 6f')).toBe('Hello');
    expect(hexToText('0x48,0x69')).toBe('Hi');
    expect(hexToText('48:69')).toBe('Hi');
    expect(hexToText('\\x48\\x69')).toBe('Hi');
    expect(hexToText('c3a9f09f9982')).toBe('é🙂');
  });
  it('handles empty input', () => {
    expect(textToHex('', o)).toBe('');
    expect(hexToText('')).toBe('');
    expect(hexdump('')).toBe('');
  });
  it('rejects non-hex, odd length and invalid UTF-8', () => {
    expect(() => hexToText('zz')).toThrow(/0-9 and a-f/);
    expect(() => hexToText('abc')).toThrow(/even number/);
    expect(() => hexToText('ff')).toThrow(/UTF-8/);
  });
  it('prints a hexdump', () => {
    expect(hexdump('Hello, world!\n')).toBe('00000000  48 65 6c 6c 6f 2c 20 77  6f 72 6c 64 21 0a        |Hello, world!.|');
  });
  it('wraps hexdump lines at 16 bytes', () => {
    const lines = hexdump('a'.repeat(40)).split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]!.startsWith('00000010')).toBe(true);
  });
  it('handles large input', () => {
    const s = 'abcdef'.repeat(100_000);
    expect(hexToText(textToHex(s, o))).toBe(s);
  });
});
