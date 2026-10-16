import { describe, expect, it } from 'vitest';
import { runRegex, type RegexRequest } from './logic';

const run = (over: Partial<RegexRequest>) => runRegex({ pattern: '', flags: 'g', text: '', replacement: '', limit: 1000, ...over });

describe('runRegex', () => {
  it('finds all matches with indexes', () => {
    const r = run({ pattern: '\\d+', text: 'a 12 b 345' });
    expect(r.matches.map((m) => [m.match, m.index, m.end])).toEqual([
      ['12', 2, 4],
      ['345', 7, 10],
    ]);
  });
  it('captures numbered and named groups', () => {
    const r = run({ pattern: '(?<year>\\d{4})-(\\d{2})', text: '2024-05 and 1999-12' });
    expect(r.matches[0]!.groups).toEqual(['2024', '05']);
    expect(r.matches[0]!.named).toEqual({ year: '2024' });
    expect(r.matches[1]!.named.year).toBe('1999');
  });
  it('reports unmatched optional groups as undefined', () => {
    expect(run({ pattern: '(a)|(b)', text: 'b' }).matches[0]!.groups).toEqual([undefined, 'b']);
  });
  it('honours flags', () => {
    expect(run({ pattern: 'abc', flags: 'gi', text: 'ABC abc' }).matches).toHaveLength(2);
    expect(run({ pattern: 'abc', flags: 'g', text: 'ABC abc' }).matches).toHaveLength(1);
    expect(run({ pattern: '^b', flags: 'gm', text: 'a\nb' }).matches).toHaveLength(1);
    expect(run({ pattern: 'a.b', flags: 's', text: 'a\nb' }).matches).toHaveLength(1);
  });
  it('stops after one match without the g flag', () => {
    expect(run({ pattern: 'a', flags: '', text: 'aaa' }).matches).toHaveLength(1);
  });
  it('does not loop forever on empty matches', () => {
    expect(run({ pattern: 'x*', text: 'ab' }).matches).toHaveLength(3);
    expect(run({ pattern: '', flags: 'gu', text: '🙂' }).matches).toHaveLength(2);
  });
  it('replaces with groups and special patterns', () => {
    expect(run({ pattern: '(\\w+) (\\w+)', text: 'hello world', replacement: '$2 $1' }).replaced).toBe('world hello');
    expect(run({ pattern: '(?<w>o)', text: 'foo', replacement: '[$<w>]' }).replaced).toBe('f[o][o]');
    expect(run({ pattern: 'o', text: 'foo', replacement: '<$&>' }).replaced).toBe('f<o><o>');
  });
  it('leaves replaced null without a replacement', () => {
    expect(run({ pattern: 'a', text: 'a' }).replaced).toBeNull();
  });
  it('truncates at the match limit', () => {
    const r = run({ pattern: 'a', text: 'a'.repeat(50), limit: 10 });
    expect(r.matches).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });
  it('handles unicode text', () => {
    expect(run({ pattern: '\\p{L}+', flags: 'gu', text: 'héllo wörld ✓' }).matches.map((m) => m.match)).toEqual(['héllo', 'wörld']);
  });
  it('explains invalid patterns', () => {
    expect(() => run({ pattern: '(', text: 'x' })).toThrow(/Invalid regular expression/);
    expect(() => run({ pattern: 'a', flags: 'gg', text: 'x' })).toThrow(/Invalid regular expression/);
  });
  it('handles large input', () => {
    const text = 'word '.repeat(200_000);
    expect(run({ pattern: 'word', text, limit: 1_000_000 }).matches).toHaveLength(200_000);
  });
});
