import { describe, expect, it } from 'vitest';
import { filterSections, SECTIONS } from './logic';

describe('regex cheatsheet', () => {
  it('has content in every section', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(8);
    for (const s of SECTIONS) expect(s.entries.length, s.title).toBeGreaterThan(0);
  });
  it('shows everything for an empty query', () => {
    expect(filterSections('')).toBe(SECTIONS);
    expect(filterSections('   ')).toBe(SECTIONS);
  });
  it('filters by words in the token, meaning or example', () => {
    const r = filterSections('lookbehind');
    expect(r.flatMap((s) => s.entries)).toHaveLength(2);
    expect(filterSections('word boundary')[0]!.entries[0]!.token).toBe('\\b  \\B');
  });
  it('matches every word, case-insensitively', () => {
    expect(filterSections('LAZY match').flatMap((s) => s.entries)).toHaveLength(1);
    expect(filterSections('zzzzzz')).toEqual([]);
  });
  it('can search by token', () => {
    expect(filterSections('(?<name>').flatMap((s) => s.entries).length).toBeGreaterThan(0);
  });
  it('has a unique token per entry within a section', () => {
    for (const s of SECTIONS) expect(new Set(s.entries.map((e) => e.token)).size, s.title).toBe(s.entries.length);
  });
});
