import { describe, expect, it } from 'vitest';
import { computeDiff, diffStats, toRows, unifiedPatch } from './logic';

const lines = { granularity: 'lines', ignoreCase: false, ignoreWhitespace: false } as const;

describe('computeDiff', () => {
  it('finds added and removed lines', () => {
    const parts = computeDiff('a\nb\nc\n', 'a\nx\nc\n', lines);
    expect(parts.map((p) => [p.removed ? '-' : p.added ? '+' : '=', p.value])).toEqual([
      ['=', 'a\n'],
      ['-', 'b\n'],
      ['+', 'x\n'],
      ['=', 'c\n'],
    ]);
  });
  it('reports no changes for identical text', () => {
    expect(computeDiff('same', 'same', lines).every((p) => !p.added && !p.removed)).toBe(true);
    expect(unifiedPatch('same', 'same')).toBe('No differences');
  });
  it('can ignore case and whitespace', () => {
    expect(computeDiff('Hello\n', 'hello\n', { ...lines, ignoreCase: true }).every((p) => !p.added && !p.removed)).toBe(true);
    expect(computeDiff('a  b\n', 'a b\n', { ...lines, ignoreWhitespace: true }).every((p) => !p.added && !p.removed)).toBe(true);
  });
  it('diffs words and characters', () => {
    const words = computeDiff('the quick fox', 'the slow fox', { ...lines, granularity: 'words' });
    expect(words.find((p) => p.removed)?.value).toBe('quick');
    expect(words.find((p) => p.added)?.value).toBe('slow');
    const chars = computeDiff('kitten', 'sitting', { ...lines, granularity: 'chars' });
    expect(chars.filter((p) => p.added).map((p) => p.value).join('')).toBe('si' + 'g');
  });
  it('treats an empty side as all added or removed', () => {
    const parts = computeDiff('one\ntwo', '', lines);
    expect(parts).toHaveLength(1);
    expect(parts[0]!.removed).toBe(true);
    expect(computeDiff('', 'x', lines)[0]!.added).toBe(true);
  });
  it('handles unicode', () => {
    expect(computeDiff('é\n', 'è\n', lines).some((p) => p.added && p.value === 'è\n')).toBe(true);
  });
  it('handles large input', () => {
    const a = Array.from({ length: 20_000 }, (_, i) => `line ${i}`).join('\n');
    const b = a.replace('line 10000', 'changed');
    const stats = diffStats(computeDiff(a, b, lines), 'lines');
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
  });
});

describe('toRows', () => {
  it('pairs changed lines side by side', () => {
    const rows = toRows(computeDiff('a\nb\nc\n', 'a\nx\ny\nc\n', lines));
    expect(rows.map((r) => [r.left, r.right, r.kind])).toEqual([
      ['a', 'a', 'same'],
      ['b', 'x', 'changed'],
      [null, 'y', 'added'],
      ['c', 'c', 'same'],
    ]);
  });
  it('marks removals', () => {
    const rows = toRows(computeDiff('a\nb\n', 'a\n', lines));
    expect(rows[1]).toEqual({ left: 'b', right: null, kind: 'removed' });
  });
});

describe('unifiedPatch', () => {
  it('prints a unified diff with headers and hunks', () => {
    const p = unifiedPatch('a\nb\n', 'a\nc\n');
    expect(p).toContain('--- original');
    expect(p).toContain('+++ changed');
    expect(p).toContain('-b');
    expect(p).toContain('+c');
  });
});
