import { describe, expect, it } from 'vitest';
import { cleanWhitespace, DEFAULT_WHITESPACE } from './logic';

const run = (s: string, over: Partial<typeof DEFAULT_WHITESPACE> = {}) => cleanWhitespace(s, { ...DEFAULT_WHITESPACE, ...over });

describe('cleanWhitespace', () => {
  it('trims lines and collapses repeated spaces', () => {
    expect(run('  a    b  \n\tc\t')).toBe('a b\nc');
  });
  it('collapses runs of blank lines to one', () => {
    expect(run('a\n\n\n\nb')).toBe('a\n\nb');
  });
  it('removes blank lines entirely when asked', () => {
    expect(run('a\n\n\nb', { removeBlankLines: true })).toBe('a\nb');
  });
  it('joins lines into one paragraph', () => {
    expect(run('a\nb\n\nc', { joinLines: true })).toBe('a b c');
  });
  it('keeps indentation when not trimming', () => {
    expect(run('  a   b  ', { trimLines: false })).toBe('  a b');
  });
  it('converts tabs and non-breaking spaces', () => {
    expect(run('a  b', {})).toBe('a b');
    expect(run('\ta', { trimLines: false, tabsToSpaces: true, collapseSpaces: false })).toBe('    a');
  });
  it('strips zero-width characters', () => {
    expect(run('a​b﻿c', { stripInvisible: true })).toBe('abc');
    expect(run('a​b', { stripInvisible: false })).toBe('a​b');
  });
  it('normalises line endings', () => {
    expect(run('a\r\nb', { lineEnding: 'lf' })).toBe('a\nb');
    expect(run('a\nb', { lineEnding: 'crlf' })).toBe('a\r\nb');
    expect(run('a\r\nb', { lineEnding: 'keep' })).toBe('a\r\nb');
  });
  it('handles empty and unicode input', () => {
    expect(run('')).toBe('');
    expect(run('  é   ✓  ')).toBe('é ✓');
  });
  it('handles large input', () => {
    const big = '  word   word  \n\n\n'.repeat(100_000);
    expect(run(big).length).toBeLessThan(big.length);
  });
});
