import { describe, expect, it } from 'vitest';
import { evaluateBitwise, type Width } from './logic';

const u = (e: string, w: Width = 32) => evaluateBitwise(e, w).unsigned;
const s = (e: string, w: Width = 32) => evaluateBitwise(e, w).signed;

describe('operators', () => {
  it('AND / OR / XOR / NOT', () => {
    expect(u('0xFF & 0x0F')).toBe(15n);
    expect(u('0xF0 | 0x0F')).toBe(255n);
    expect(u('5 ^ 3')).toBe(6n);
    expect(u('~0')).toBe(4294967295n);
    expect(u('~0', 8)).toBe(255n);
    expect(u('~0xF0', 8)).toBe(0x0fn);
  });
  it('shifts: left, arithmetic right, logical right', () => {
    expect(u('1 << 4')).toBe(16n);
    expect(u('1 << 31')).toBe(2147483648n);
    expect(s('1 << 31')).toBe(-2147483648n);
    expect(u('1 << 32')).toBe(0n);
    expect(s('-16 >> 2')).toBe(-4n);
    expect(u('-1 >>> 28')).toBe(15n);
    expect(u('0x80 >> 7', 8)).toBe(0xffn);
    expect(u('0x80 >>> 7', 8)).toBe(1n);
    expect(u('1 << 63', 64)).toBe(9223372036854775808n);
  });
  it('arithmetic wraps at the chosen width', () => {
    expect(u('255 + 1', 8)).toBe(0n);
    expect(u('0 - 1', 8)).toBe(255n);
    expect(s('0 - 1', 8)).toBe(-1n);
    expect(u('200 * 2', 8)).toBe(144n);
    expect(u('17 / 5')).toBe(3n);
    expect(u('17 % 5')).toBe(2n);
    expect(u('-1', 16)).toBe(65535n);
  });
  it('rotates', () => {
    expect(u('rol(0x80000001, 1)')).toBe(3n);
    expect(u('ror(3, 1)')).toBe(0x80000001n);
    expect(u('rol(0x81, 1)', 8)).toBe(3n);
    expect(u('rol(1, 32)')).toBe(1n);
  });
  it('precedence and parentheses follow C rules', () => {
    expect(u('1 | 2 & 3')).toBe(3n);
    expect(u('(1 | 2) & 2')).toBe(2n);
    expect(u('1 + 2 << 2')).toBe(12n);
    expect(u('6 ^ 3 & 1')).toBe(7n);
  });
  it('accepts literals in every base with underscores', () => {
    expect(u('0b1010_1010 | 0o17 | 0x100')).toBe(0b10101010 | 0o17 | 0x100 ? BigInt(0b10101010 | 0o17 | 0x100) : 0n);
    expect(u('1_000')).toBe(1000n);
  });
});

describe('result details', () => {
  it('describes the value', () => {
    const r = evaluateBitwise('0x00F0', 16);
    expect(r.hex).toBe('0x00F0');
    expect(r.binary).toBe('00000000 11110000');
    expect(r.popcount).toBe(4);
    expect(r.leadingZeros).toBe(8);
    expect(r.trailingZeros).toBe(4);
    expect(r.setBits).toEqual([4, 5, 6, 7]);
    expect(r.byteSwapped).toBe('0xF000');
    expect(evaluateBitwise('0').leadingZeros).toBe(32);
  });
});

describe('malformed input', () => {
  it('explains what is wrong', () => {
    expect(() => evaluateBitwise('')).toThrow(/Enter an expression/);
    expect(() => evaluateBitwise('1 +')).toThrow(/ends too early/);
    expect(() => evaluateBitwise('(1 + 2')).toThrow(/closing parenthesis/);
    expect(() => evaluateBitwise('1 2')).toThrow(/Unexpected/);
    expect(() => evaluateBitwise('5 / 0')).toThrow(/Division by zero/);
    expect(() => evaluateBitwise('1 << -1')).toThrow(/negative/);
    expect(() => evaluateBitwise('foo(1)')).toThrow(/Unknown name/);
    expect(() => evaluateBitwise('1 $ 2')).toThrow(/Unexpected character/);
    expect(() => evaluateBitwise('0x')).toThrow(/not a valid number/);
    expect(() => evaluateBitwise('12abc')).toThrow(/not a valid number/);
    expect(() => evaluateBitwise('rol(1)')).toThrow(/two arguments/);
  });
});
