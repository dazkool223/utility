import { describe, expect, it } from 'vitest';
import { generateLorem } from './logic';

const base = { unit: 'paragraphs', count: 3, startWithLorem: true, html: false } as const;

describe('generateLorem', () => {
  it('starts with the classic opening', () => {
    expect(generateLorem(base)).toMatch(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit/);
  });
  it('can skip the classic opening', () => {
    const out = generateLorem({ ...base, startWithLorem: false, count: 1 }, () => 0);
    expect(out.startsWith('Lorem ipsum')).toBe(false);
  });
  it('produces the requested number of paragraphs, sentences and words', () => {
    expect(generateLorem(base).split('\n\n')).toHaveLength(3);
    expect(generateLorem({ ...base, unit: 'sentences', count: 4 }).match(/\./g)).toHaveLength(4);
    expect(generateLorem({ ...base, unit: 'words', count: 25 }).split(' ')).toHaveLength(25);
    expect(generateLorem({ ...base, unit: 'words', count: 3 })).toBe('lorem ipsum dolor');
  });
  it('wraps paragraphs and sentences in HTML', () => {
    const out = generateLorem({ ...base, html: true, count: 2 }).split('\n');
    expect(out).toHaveLength(2);
    expect(out.every((l) => l.startsWith('<p>') && l.endsWith('</p>'))).toBe(true);
  });
  it('is deterministic with a fixed random source', () => {
    const a = generateLorem(base, () => 1);
    expect(generateLorem(base, () => 1)).toBe(a);
  });
  it('differs between runs with the crypto RNG', () => {
    expect(generateLorem({ ...base, startWithLorem: false })).not.toBe(generateLorem({ ...base, startWithLorem: false }));
  });
  it('clamps silly counts', () => {
    expect(generateLorem({ ...base, count: 0, unit: 'words' }).split(' ')).toHaveLength(1);
    expect(generateLorem({ ...base, count: Number.NaN, unit: 'words' }).split(' ')).toHaveLength(1);
    expect(generateLorem({ ...base, count: 10_000_000, unit: 'words' }).split(' ')).toHaveLength(100_000);
  });
  it('handles a large request quickly', () => {
    expect(generateLorem({ ...base, count: 500 }).length).toBeGreaterThan(100_000);
  });
});
