import { describe, expect, it } from 'vitest';
import { ToolError } from '@/core/types';
import { gunzipBlob, gzipBlob, isGzip, outputName } from './logic';

const bytesOf = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

describe('gzip file', () => {
  it('round-trips text', async () => {
    const original = new Blob(['hello hello hello hello\n'.repeat(50)]);
    const gz = await gzipBlob(original);
    expect(isGzip(await bytesOf(gz))).toBe(true);
    expect(gz.size).toBeLessThan(original.size);
    expect(await (await gunzipBlob(gz)).text()).toBe(await original.text());
  });

  it('round-trips unicode and binary bytes', async () => {
    const bin = new Uint8Array(5000).map((_, i) => (i * 31) & 0xff);
    const back = await gunzipBlob(await gzipBlob(new Blob([bin])));
    expect(await bytesOf(back)).toEqual(bin);
    const text = 'héllo 世界 🙂';
    expect(await (await gunzipBlob(await gzipBlob(new Blob([text])))).text()).toBe(text);
  });

  it('compresses an empty file to a valid gzip stream', async () => {
    const gz = await gzipBlob(new Blob([]));
    expect(isGzip(await bytesOf(gz))).toBe(true);
    expect((await gunzipBlob(gz)).size).toBe(0);
  });

  it('handles a larger input', async () => {
    const big = new Uint8Array(3_000_000).map((_, i) => i % 251);
    const back = await gunzipBlob(await gzipBlob(new Blob([big])));
    expect(back.size).toBe(big.length);
  });

  it('rejects input that is not gzip', async () => {
    await expect(gunzipBlob(new Blob(['plain text']))).rejects.toThrow(ToolError);
    await expect(gunzipBlob(new Blob([]))).rejects.toThrow('empty');
  });

  it('rejects truncated gzip data', async () => {
    const gz = await bytesOf(await gzipBlob(new Blob(['abc'.repeat(1000)])));
    await expect(gunzipBlob(new Blob([gz.slice(0, gz.length - 12)]))).rejects.toThrow(/damaged|truncated/);
  });

  it('names output files', () => {
    expect(outputName('notes.txt', 'compress')).toBe('notes.txt.gz');
    expect(outputName('notes.txt.gz', 'decompress')).toBe('notes.txt');
    expect(outputName('a.tgz', 'decompress')).toBe('a.tar');
    expect(outputName('weird', 'decompress')).toBe('weird.out');
  });
});

describe('decompression bombs', () => {
  it('stops decompressing past the output cap', async () => {
    const gz = await gzipBlob(new Blob([new Uint8Array(4 * 1024 * 1024)]));
    expect(gz.size).toBeLessThan(10_000);
    await expect(gunzipBlob(gz, 1024 * 1024)).rejects.toThrow(/larger than 1\.0 MB/);
    expect((await gunzipBlob(gz)).size).toBe(4 * 1024 * 1024);
  });
});
