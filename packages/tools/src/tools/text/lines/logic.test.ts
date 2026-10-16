import { describe, expect, it } from 'vitest';
import { applyLineOp, DEFAULT_LINE_OPTIONS, splitLines } from './logic';

const run = (input: string, over: Partial<typeof DEFAULT_LINE_OPTIONS>, rand?: (m: number) => number) => applyLineOp(input, { ...DEFAULT_LINE_OPTIONS, ...over }, rand);

describe('splitLines', () => {
  it('ignores one trailing newline and handles CRLF', () => {
    expect(splitLines('a\r\nb\n')).toEqual({ lines: ['a', 'b'], trailingNewline: true });
    expect(splitLines('')).toEqual({ lines: [], trailingNewline: false });
  });
});

describe('applyLineOp', () => {
  it('sorts ascending and descending', () => {
    expect(run('b\na\nc', {})).toBe('a\nb\nc');
    expect(run('b\na\nc', { descending: true })).toBe('c\nb\na');
  });
  it('sorts case-insensitively and naturally', () => {
    expect(run('b\nA\nc', { ignoreCase: true })).toBe('A\nb\nc');
    expect(run('file10\nfile2\nfile1', { natural: true })).toBe('file1\nfile2\nfile10');
    expect(run('file10\nfile2\nfile1', {})).toBe('file1\nfile10\nfile2');
  });
  it('sorts by length', () => {
    expect(run('ccc\na\nbb', { byLength: true })).toBe('a\nbb\nccc');
  });
  it('removes duplicates keeping the first', () => {
    expect(run('a\nb\na\nc\nb', { op: 'dedupe' })).toBe('a\nb\nc');
    expect(run('a\nA\nb', { op: 'dedupe', ignoreCase: true })).toBe('a\nb');
  });
  it('reverses, trims and removes empty lines', () => {
    expect(run('1\n2\n3', { op: 'reverse' })).toBe('3\n2\n1');
    expect(run('  a  \n\tb', { op: 'trim' })).toBe('a\nb');
    expect(run('a\n\n  \nb', { op: 'remove-empty' })).toBe('a\nb');
  });
  it('shuffles without losing lines', () => {
    const input = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
    const out = run(input, { op: 'shuffle' }).split('\n');
    expect(out.sort()).toEqual(input.split('\n').sort());
  });
  it('shuffles deterministically with a fixed rand', () => {
    expect(run('1\n2\n3\n4', { op: 'shuffle' }, () => 0)).toBe('2\n3\n4\n1');
  });
  it('keeps the trailing newline and handles empty input', () => {
    expect(run('b\na\n', {})).toBe('a\nb\n');
    expect(run('', {})).toBe('');
  });
  it('keeps unicode lines', () => {
    expect(run('é\nz\na', {})).toBe('a\nz\né');
  });
  it('handles large input', () => {
    const big = Array.from({ length: 300_000 }, (_, i) => `row ${(i * 7919) % 100_000}`).join('\n');
    expect(run(big, { op: 'dedupe' }).split('\n').length).toBeLessThanOrEqual(100_000);
    expect(run(big, {}).split('\n')).toHaveLength(300_000);
  });
});
