import { describe, expect, it } from 'vitest';
import { compareLists } from './logic';

const o = { op: 'union', trim: true, ignoreCase: false } as const;
const A = 'apple\nbanana\ncherry\nbanana';
const B = 'banana\ndate\ncherry\nelder';

describe('compareLists', () => {
  it('computes each set operation', () => {
    expect(compareLists(A, B, { ...o, op: 'union' }).items).toEqual(['apple', 'banana', 'cherry', 'date', 'elder']);
    expect(compareLists(A, B, { ...o, op: 'intersection' }).items).toEqual(['banana', 'cherry']);
    expect(compareLists(A, B, { ...o, op: 'a-only' }).items).toEqual(['apple']);
    expect(compareLists(A, B, { ...o, op: 'b-only' }).items).toEqual(['date', 'elder']);
    expect(compareLists(A, B, { ...o, op: 'symmetric' }).items).toEqual(['apple', 'date', 'elder']);
  });
  it('reports counts', () => {
    expect(compareLists(A, B, o).counts).toEqual({ a: 3, b: 4, both: 2, aOnly: 1, bOnly: 2, union: 5 });
  });
  it('trims and ignores empty lines by default', () => {
    expect(compareLists(' a \n\nb', 'a\r\nc', { ...o, op: 'intersection' }).items).toEqual(['a']);
  });
  it('can keep whitespace significant', () => {
    expect(compareLists(' a', 'a', { ...o, trim: false, op: 'intersection' }).items).toEqual([]);
  });
  it('can ignore case, keeping the first spelling', () => {
    expect(compareLists('Apple', 'apple\nPear', { ...o, ignoreCase: true, op: 'union' }).items).toEqual(['Apple', 'Pear']);
  });
  it('treats an empty list as nothing', () => {
    expect(compareLists('a\nb', '', { ...o, op: 'a-only' }).items).toEqual(['a', 'b']);
    expect(compareLists('', '', o).items).toEqual([]);
  });
  it('handles unicode and large lists', () => {
    expect(compareLists('é\nü', 'ü', { ...o, op: 'a-only' }).items).toEqual(['é']);
    const big = Array.from({ length: 200_000 }, (_, i) => `item${i}`).join('\n');
    const other = Array.from({ length: 200_000 }, (_, i) => `item${i + 100_000}`).join('\n');
    expect(compareLists(big, other, { ...o, op: 'intersection' }).items).toHaveLength(100_000);
  });
});
