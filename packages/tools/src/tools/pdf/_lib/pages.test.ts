import { describe, expect, it } from 'vitest';
import { parsePageRanges, splitGroups } from './pages';
import { pad, stripExtension } from './files';

describe('parsePageRanges', () => {
  it('parses single pages and ranges in the order written', () => {
    expect(parsePageRanges('1-3, 5', 10)).toEqual([1, 2, 3, 5]);
    expect(parsePageRanges('5,1', 10)).toEqual([5, 1]);
  });
  it('supports open-ended ranges', () => {
    expect(parsePageRanges('8-', 10)).toEqual([8, 9, 10]);
    expect(parsePageRanges('-3', 10)).toEqual([1, 2, 3]);
  });
  it('counts down for reversed ranges', () => {
    expect(parsePageRanges('4-2', 10)).toEqual([4, 3, 2]);
  });
  it('keeps duplicates so a page can appear twice', () => {
    expect(parsePageRanges('1,1', 3)).toEqual([1, 1]);
  });
  it('ignores empty parts and surrounding spaces', () => {
    expect(parsePageRanges(' 2 - 3 ,, 1 ', 5)).toEqual([2, 3, 1]);
  });
  it('rejects empty input', () => {
    expect(() => parsePageRanges('', 5)).toThrow(/Enter the pages/);
    expect(() => parsePageRanges(' , ', 5)).toThrow(/Enter the pages/);
  });
  it('rejects pages outside the document', () => {
    expect(() => parsePageRanges('0', 5)).toThrow(/Page 0 does not exist/);
    expect(() => parsePageRanges('2-9', 5)).toThrow(/Page 9 does not exist. This PDF has 5 pages/);
    expect(() => parsePageRanges('2', 1)).toThrow(/has 1 page\./);
  });
  it('rejects garbage', () => {
    expect(() => parsePageRanges('a-b', 5)).toThrow(/not a page/);
    expect(() => parsePageRanges('1-2-3', 5)).toThrow(/not a page/);
    expect(() => parsePageRanges('-', 5)).toThrow(/not a page/);
  });
});

describe('helpers', () => {
  it('splits groups', () => {
    expect(splitGroups('1-2, 5 ,')).toEqual(['1-2', '5']);
  });
  it('pads numbers to the width of the total', () => {
    expect(pad(3, 12)).toBe('03');
    expect(pad(3, 5)).toBe('3');
  });
  it('strips extensions', () => {
    expect(stripExtension('report.final.pdf')).toBe('report.final');
    expect(stripExtension('.pdf')).toBe('document');
    expect(stripExtension('')).toBe('document');
  });
});
