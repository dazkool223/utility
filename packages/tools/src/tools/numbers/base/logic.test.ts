import { describe, expect, it } from 'vitest';
import { convertBase, convertNumber, parseInBase, toBase } from './logic';

describe('parseInBase', () => {
  it('parses bases 2..36 and prefixes', () => {
    expect(parseInBase('255', 10).value).toBe(255n);
    expect(parseInBase('ff', 16).value).toBe(255n);
    expect(parseInBase('FF', 16).value).toBe(255n);
    expect(parseInBase('0xff', 'auto')).toEqual({ value: 255n, base: 16 });
    expect(parseInBase('0b1010', 'auto')).toEqual({ value: 10n, base: 2 });
    expect(parseInBase('0o17', 'auto')).toEqual({ value: 15n, base: 8 });
    expect(parseInBase('zz', 36).value).toBe(1295n);
    expect(parseInBase('1111 0000', 2).value).toBe(240n);
    expect(parseInBase('1_000_000', 10).value).toBe(1000000n);
  });
  it('handles signs and arbitrary precision', () => {
    expect(parseInBase('-42', 10).value).toBe(-42n);
    expect(parseInBase('18446744073709551616', 10).value).toBe(1n << 64n);
    expect(parseInBase('0xFFFFFFFFFFFFFFFFFFFFFFFF', 'auto').value).toBe((1n << 96n) - 1n);
  });
  it('base 62 is case-sensitive', () => {
    expect(parseInBase('z', 62).value).toBe(35n);
    expect(parseInBase('Z', 62).value).toBe(61n);
    expect(toBase(61n, 62)).toBe('Z');
  });
  it('rejects bad digits, bases and decimals', () => {
    expect(() => parseInBase('', 10)).toThrow(/Enter a number/);
    expect(() => parseInBase('12', 2)).toThrow(/not a valid digit in base 2/);
    expect(() => parseInBase('xyz', 16)).toThrow(/not a valid digit/);
    expect(() => parseInBase('1', 1 as 2)).toThrow(/base must be/);
    expect(() => parseInBase('1.5', 10)).toThrow(/whole numbers/);
    expect(() => parseInBase('0x', 'auto')).toThrow();
  });
});

describe('toBase / convertNumber', () => {
  it('round-trips through every base', () => {
    for (const b of [2, 3, 7, 8, 16, 32, 36, 37, 62]) expect(parseInBase(toBase(123456789012345678901234567890n, b), b).value).toBe(123456789012345678901234567890n);
    expect(toBase(0n, 2)).toBe('0');
    expect(toBase(-255n, 16)).toBe('-ff');
  });
  it('shows all standard bases', () => {
    const { rows } = convertNumber('255', 10);
    const get = (l: string) => rows.find((r) => r.label.startsWith(l))?.value;
    expect(get('Binary')).toBe('1111 1111');
    expect(get('Octal')).toBe('377');
    expect(get('Hexadecimal')).toBe('FF');
    expect(get('Base 36')).toBe('73');
    expect(get('Bits needed')).toBe('8');
  });
  it("two's complement for negatives", () => {
    const { rows } = convertNumber('-1', 10);
    expect(rows.find((r) => r.label.includes('8-bit'))?.value).toBe('0xFF');
    expect(rows.find((r) => r.label.includes('64-bit'))?.value).toBe('0xFFFFFFFFFFFFFFFF');
    expect(convertNumber('-129', 10).rows.some((r) => r.label.includes('8-bit'))).toBe(false);
  });
  it('custom base row and pipeline helper', () => {
    expect(convertNumber('100', 10, 7).rows.find((r) => r.label === 'Base 7')?.value).toBe('202');
    expect(convertBase('ff', 16, 10)).toBe('255');
    expect(convertBase('255', 10, 2)).toBe('11111111');
  });
});
