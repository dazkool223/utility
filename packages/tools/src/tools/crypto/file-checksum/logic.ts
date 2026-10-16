import { ToolError } from '@/core/types';

export const FILE_ALGOS = [
  ['md5', 'MD5'],
  ['sha1', 'SHA-1'],
  ['sha256', 'SHA-256'],
  ['sha384', 'SHA-384'],
  ['sha512', 'SHA-512'],
  ['sha3-256', 'SHA3-256'],
  ['blake2b', 'BLAKE2b-512'],
  ['blake3', 'BLAKE3'],
  ['xxh64', 'xxHash64'],
  ['crc32', 'CRC-32'],
] as const;

export type FileAlgo = (typeof FILE_ALGOS)[number][0];

type Hasher = import('hash-wasm').IHasher;

async function make(id: string): Promise<Hasher> {
  const h = await import('hash-wasm');
  switch (id) {
    case 'md5': return h.createMD5();
    case 'sha1': return h.createSHA1();
    case 'sha256': return h.createSHA256();
    case 'sha384': return h.createSHA384();
    case 'sha512': return h.createSHA512();
    case 'sha3-256': return h.createSHA3(256);
    case 'blake2b': return h.createBLAKE2b(512);
    case 'blake3': return h.createBLAKE3();
    case 'xxh64': return h.createXXHash64();
    case 'crc32': return h.createCRC32();
    default: throw new ToolError(`Unknown algorithm "${id}".`);
  }
}

/**
 * Streams `blob` once and feeds every selected hasher, so memory stays flat for multi-GB files.
 * `onProgress` receives the fraction 0..1.
 */
export async function hashBlob(blob: Blob, ids: string[], onProgress?: (fraction: number) => void): Promise<Record<string, string>> {
  if (!ids.length) throw new ToolError('Pick at least one algorithm.');
  const hashers = await Promise.all(ids.map(make));
  hashers.forEach((h) => h.init());
  const reader = blob.stream().getReader();
  let done = 0;
  let lastReport = 0;
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    for (const h of hashers) h.update(value);
    done += value.length;
    const now = performance.now();
    if (onProgress && now - lastReport > 80) {
      lastReport = now;
      onProgress(blob.size ? done / blob.size : 1);
    }
  }
  onProgress?.(1);
  const out: Record<string, string> = {};
  ids.forEach((id, i) => (out[id] = hashers[i]!.digest('hex')));
  return out;
}

/** Normalises a pasted checksum (whitespace, `sha256:` prefix, `*filename` suffix from sha256sum files). */
export function normaliseChecksum(s: string): string {
  const first = s.trim().split(/\s+/)[0] ?? '';
  return first.replace(/^[a-z0-9-]+[:=]/i, '').toLowerCase();
}
