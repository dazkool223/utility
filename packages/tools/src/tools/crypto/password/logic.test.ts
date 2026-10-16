import { describe, expect, it } from 'vitest';
import { AMBIGUOUS, entropyLabel, generatePassphrases, generatePasswords, loadWordlist, type PasswordOptions } from './logic';

const base: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false, count: 1 };

describe('generatePasswords', () => {
  it('has the requested length and contains every chosen class', () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePasswords({ ...base, length: 8 }).passwords[0]!;
      expect(p).toHaveLength(8);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });
  it('reports entropy as length * log2(pool)', () => {
    const r = generatePasswords({ ...base, symbols: false, upper: false, length: 10 });
    expect(r.poolSize).toBe(36);
    expect(r.entropyBits).toBeCloseTo(10 * Math.log2(36), 6);
  });
  it('excludes ambiguous and custom characters', () => {
    const r = generatePasswords({ ...base, excludeAmbiguous: true, exclude: 'abc', length: 200, count: 5 });
    for (const p of r.passwords) for (const ch of AMBIGUOUS + 'abc') expect(p).not.toContain(ch);
  });
  it('is roughly uniform (no modulo bias, sanity check)', () => {
    const counts = new Map<string, number>();
    const r = generatePasswords({ ...base, upper: false, symbols: false, digits: true, length: 500, count: 40 });
    for (const p of r.passwords) for (const ch of p) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    const avg = 20000 / 36;
    for (const n of counts.values()) expect(Math.abs(n - avg)).toBeLessThan(avg * 0.35);
  });
  it('rejects bad options', () => {
    expect(() => generatePasswords({ ...base, lower: false, upper: false, digits: false, symbols: false })).toThrow(/at least one/);
    expect(() => generatePasswords({ ...base, length: 2 })).toThrow(/Increase the length/);
    expect(() => generatePasswords({ ...base, length: 0 })).toThrow(/Length/);
    expect(() => generatePasswords({ ...base, length: 100000 })).toThrow(/Length/);
  });
  it('generates distinct bulk passwords', () => {
    const r = generatePasswords({ ...base, count: 100 });
    expect(new Set(r.passwords).size).toBe(100);
  });
});

describe('generatePassphrases', () => {
  it('uses the 7776-word list at 12.92 bits per word', async () => {
    const list = await loadWordlist();
    expect(list).toHaveLength(7776);
    const r = generatePassphrases({ words: 5, separator: '-', capitalize: false, addNumber: false, count: 3 }, list);
    expect(r.entropyBits).toBeCloseTo(5 * Math.log2(7776), 6);
    for (const p of r.passwords) {
      const parts = p.split('-');
      expect(parts).toHaveLength(5);
      for (const w of parts) expect(list).toContain(w);
    }
  });
  it('capitalises and appends a number', () => {
    const r = generatePassphrases({ words: 2, separator: ' ', capitalize: true, addNumber: true, count: 1 }, ['alpha', 'beta']);
    expect(r.passwords[0]).toMatch(/^[AB][a-z]+ [AB][a-z]+ \d{1,2}$/);
  });
  it('rejects bad word counts', () => {
    expect(() => generatePassphrases({ words: 0, separator: '-', capitalize: false, addNumber: false, count: 1 }, ['a', 'b'])).toThrow();
  });
});

describe('entropyLabel', () => {
  it('maps bits to labels', () => {
    expect(entropyLabel(20)).toBe('weak');
    expect(entropyLabel(70)).toBe('good');
    expect(entropyLabel(128)).toBe('very strong');
  });
});
