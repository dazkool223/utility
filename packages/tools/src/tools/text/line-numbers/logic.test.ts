import { describe, expect, it } from 'vitest';
import { decorateLines, DEFAULT_DECORATE, removeLineNumbers, wrapLine } from './logic';

const run = (s: string, over: Partial<typeof DEFAULT_DECORATE> = {}) => decorateLines(s, { ...DEFAULT_DECORATE, ...over });

describe('decorateLines', () => {
  it('adds line numbers', () => {
    expect(run('a\nb\nc')).toBe('1: a\n2: b\n3: c');
  });
  it('pads numbers to the same width', () => {
    const out = run(Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n')).split('\n');
    expect(out[0]).toBe(' 1: l0');
    expect(out[9]).toBe('10: l9');
    expect(run('a\nb', { padNumbers: false, start: 9 })).toBe('9: a\n10: b');
  });
  it('supports start, separator and skipping empty lines', () => {
    expect(run('a\n\nb', { start: 10, separator: '. ', skipEmpty: true })).toBe('10. a\n\n11. b');
  });
  it('adds prefix and suffix without numbers', () => {
    expect(run('a\nb', { numbers: false, prefix: '- ', suffix: ',' })).toBe('- a,\n- b,');
    expect(run('x', { numbers: false, prefix: "'", suffix: "'," })).toBe("'x',");
  });
  it('wraps long lines at word boundaries', () => {
    expect(wrapLine('the quick brown fox jumps', 10)).toEqual(['the quick', 'brown fox', 'jumps']);
    expect(wrapLine('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
    expect(run('the quick brown fox', { numbers: false, wrap: 10 })).toBe('the quick\nbrown fox');
  });
  it('handles CRLF, empty and unicode input', () => {
    expect(run('a\r\nb', { numbers: false, prefix: '> ' })).toBe('> a\n> b');
    expect(run('')).toBe('');
    expect(run('é✓', { numbers: false, prefix: '# ' })).toBe('# é✓');
  });
  it('handles large input', () => {
    const big = 'line\n'.repeat(200_000);
    expect(run(big).split('\n')).toHaveLength(200_001);
  });
});

describe('removeLineNumbers', () => {
  it('removes common numbering styles', () => {
    expect(removeLineNumbers('1. a\n2) b\n  3: c\n4\td\n5 e\n[6] f')).toBe('a\nb\nc\nd\n5 e\n[6] f');
  });
  it('round-trips with decorateLines', () => {
    expect(removeLineNumbers(run('x\ny\nz'))).toBe('x\ny\nz');
  });
  it('does not touch lines that merely contain numbers', () => {
    expect(removeLineNumbers('2024 report\nabc 1. x')).toBe('2024 report\nabc 1. x');
  });
});
