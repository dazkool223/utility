import { describe, expect, it } from 'vitest';
import { hashBlob, normaliseChecksum } from './logic';

describe('hashBlob', () => {
  it('matches known vectors for "abc"', async () => {
    const r = await hashBlob(new Blob(['abc']), ['md5', 'sha1', 'sha256', 'crc32']);
    expect(r.md5).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(r.sha1).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(r.sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(r.crc32).toBe('352441c2');
  });
  it('handles an empty file', async () => {
    const r = await hashBlob(new Blob([]), ['sha256']);
    expect(r.sha256).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  it('streams a multi-chunk file identically to hashing it whole and reports progress', async () => {
    const data = new Uint8Array(5 * 1024 * 1024).map((_, i) => (i * 31) & 255);
    const seen: number[] = [];
    const streamed = await hashBlob(new Blob([data]), ['sha256', 'blake3'], (f) => seen.push(f));
    const digest = Buffer.from(await crypto.subtle.digest('SHA-256', data)).toString('hex');
    expect(streamed.sha256).toBe(digest);
    expect(seen.at(-1)).toBe(1);
  });
  it('rejects an empty selection and unknown algorithms', async () => {
    await expect(hashBlob(new Blob(['x']), [])).rejects.toThrow(/at least one/);
    await expect(hashBlob(new Blob(['x']), ['nope'])).rejects.toThrow(/Unknown/);
  });
});

describe('normaliseChecksum', () => {
  it('extracts the digest from common formats', () => {
    expect(normaliseChecksum('  ABCDEF  file.iso\n')).toBe('abcdef');
    expect(normaliseChecksum('sha256:AB12')).toBe('ab12');
    expect(normaliseChecksum('')).toBe('');
  });
});
