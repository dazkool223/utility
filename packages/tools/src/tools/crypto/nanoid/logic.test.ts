import { describe, expect, it } from 'vitest';
import { alphabetFor, generateTokens } from './logic';

describe('generateTokens', () => {
  it('nanoid uses the URL alphabet, 21 chars by default size and 6 bits per char', async () => {
    const r = await generateTokens({ kind: 'nanoid', size: 21, count: 100 });
    expect(r.entropyBits).toBe(126);
    for (const t of r.tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(new Set(r.tokens).size).toBe(100);
  });
  it('custom alphabets are honoured and entropy is exact', async () => {
    const r = await generateTokens({ kind: 'custom', alphabet: 'ab', size: 64, count: 3 });
    for (const t of r.tokens) expect(t).toMatch(/^[ab]{64}$/);
    expect(r.entropyBits).toBe(64);
  });
  it('preset alphabets', async () => {
    expect((await generateTokens({ kind: 'numeric', size: 12, count: 1 })).tokens[0]).toMatch(/^\d{12}$/);
    expect((await generateTokens({ kind: 'alphanumeric', size: 30, count: 1 })).tokens[0]).toMatch(/^[0-9a-zA-Z]{30}$/);
    expect(alphabetFor({ kind: 'custom', alphabet: 'aabbc' })).toBe('abc');
  });
  it('byte tokens: hex, base64, base64url', async () => {
    expect((await generateTokens({ kind: 'hex', size: 16, count: 1 })).tokens[0]).toMatch(/^[0-9a-f]{32}$/);
    expect((await generateTokens({ kind: 'base64', size: 3, count: 1 })).tokens[0]).toMatch(/^[A-Za-z0-9+/]{4}$/);
    const u = await generateTokens({ kind: 'base64url', size: 32, count: 1 });
    expect(u.tokens[0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(u.entropyBits).toBe(256);
  });
  it('rejects bad options', async () => {
    await expect(generateTokens({ kind: 'nanoid', size: 0, count: 1 })).rejects.toThrow(/Size/);
    await expect(generateTokens({ kind: 'nanoid', size: 99999, count: 1 })).rejects.toThrow(/Size/);
    await expect(generateTokens({ kind: 'custom', alphabet: 'a', size: 5, count: 1 })).rejects.toThrow(/at least 2/);
    await expect(generateTokens({ kind: 'custom', alphabet: '', size: 5, count: 1 })).rejects.toThrow(/at least 2/);
  });
});
