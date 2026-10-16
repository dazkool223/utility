import { describe, expect, it } from 'vitest';
import { compressToBase64, decompressFromBase64 } from './logic';

describe('gzip / deflate', () => {
  it('produces gzip Base64 that starts with the gzip magic bytes', async () => {
    expect(await compressToBase64('hello hello hello', 'gzip')).toMatch(/^H4sI/);
  });
  it('round-trips each format', async () => {
    for (const f of ['gzip', 'deflate', 'deflate-raw'] as const) {
      expect(await decompressFromBase64(await compressToBase64('héllo ✓ 🙂', f), f)).toBe('héllo ✓ 🙂');
    }
  });
  it('detects the format automatically', async () => {
    for (const f of ['gzip', 'deflate', 'deflate-raw'] as const) {
      expect(await decompressFromBase64(await compressToBase64('detect me', f), 'auto')).toBe('detect me');
    }
  });
  it('supports URL-safe Base64', async () => {
    const out = await compressToBase64('???>>>'.repeat(50), 'gzip', true);
    expect(out).not.toMatch(/[+/=]/);
    expect(await decompressFromBase64(out, 'auto')).toBe('???>>>'.repeat(50));
  });
  it('decompresses a known gzip payload', async () => {
    expect(await decompressFromBase64('H4sIAAAAAAAAA8tIzcnJVyjPL8pJAQCFEUoNCwAAAA==', 'gzip')).toBe('hello world');
  });
  it('compresses repetitive input a lot', async () => {
    const out = await compressToBase64('abc'.repeat(100_000), 'gzip');
    expect(out.length).toBeLessThan(2_000);
  });
  it('handles empty text', async () => {
    expect(await decompressFromBase64(await compressToBase64('', 'gzip'), 'gzip')).toBe('');
  });
  it('rejects bad Base64 and bad data', async () => {
    await expect(decompressFromBase64('***', 'gzip')).rejects.toThrow(/not valid Base64/);
    await expect(decompressFromBase64('aGVsbG8=', 'gzip')).rejects.toThrow(/not valid gzip/);
  });
  it('handles large input', async () => {
    const s = 'line of text\n'.repeat(200_000);
    expect(await decompressFromBase64(await compressToBase64(s, 'deflate'), 'deflate')).toBe(s);
  });
});
