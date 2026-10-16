import { describe, expect, it } from 'vitest';
import { bytesStringToText, textToBytesString } from './logic';

describe('text <-> binary', () => {
  it('encodes ASCII as 8-bit groups', () => {
    expect(textToBytesString('Hi', 2)).toBe('01001000 01101001');
  });
  it('encodes UTF-8 multi-byte characters', () => {
    expect(textToBytesString('é', 2)).toBe('11000011 10101001');
    expect(textToBytesString('🙂', 16)).toBe('F0 9F 99 82');
  });
  it('supports octal, decimal and hex', () => {
    expect(textToBytesString('A', 8)).toBe('101');
    expect(textToBytesString('A', 10)).toBe('065');
    expect(textToBytesString('A', 16, '')).toBe('41');
  });
  it('decodes with spaces, commas or a single run', () => {
    expect(bytesStringToText('01001000 01101001', 2)).toBe('Hi');
    expect(bytesStringToText('0100100001101001', 2)).toBe('Hi');
    expect(bytesStringToText('72, 105', 10)).toBe('Hi');
    expect(bytesStringToText('0x48 0x69', 16)).toBe('Hi');
  });
  it('round-trips unicode', () => {
    for (const base of [2, 8, 10, 16] as const) expect(bytesStringToText(textToBytesString('héllo ✓ 🙂', base), base)).toBe('héllo ✓ 🙂');
  });
  it('handles empty input', () => {
    expect(textToBytesString('', 2)).toBe('');
    expect(bytesStringToText('', 2)).toBe('');
  });
  it('rejects bad digits, wrong lengths and invalid UTF-8', () => {
    expect(() => bytesStringToText('0100 2000', 2)).toThrow(/not a valid base-2/);
    expect(() => bytesStringToText('010010000110100', 2)).toThrow(/multiple of 8/);
    expect(() => bytesStringToText('999', 10)).toThrow(/larger than one byte/);
    expect(() => bytesStringToText('FF', 16)).toThrow(/UTF-8/);
  });
  it('handles large input', () => {
    const s = 'abc'.repeat(100_000);
    expect(bytesStringToText(textToBytesString(s, 2), 2)).toBe(s);
  });
});
