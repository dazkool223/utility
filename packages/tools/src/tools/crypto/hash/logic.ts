import { ToolError } from '@/core/types';
import { base64ToBytes, bytesToBase64, hexToBytes, utf8 } from '../_lib/bytes';

export type OutputFormat = 'hex' | 'HEX' | 'base64';
export type InputFormat = 'text' | 'hex' | 'base64';

export interface HashResult {
  id: string;
  label: string;
  /** Lowercase hex digest. */
  hex: string;
}

type Fn = (data: Uint8Array) => Promise<string>;

/** Algorithms in display order. hash-wasm is loaded on first use. */
async function algorithms(): Promise<Array<[string, string, Fn]>> {
  const h = await import('hash-wasm');
  return [
    ['md5', 'MD5', (d) => h.md5(d)],
    ['sha1', 'SHA-1', (d) => h.sha1(d)],
    ['sha224', 'SHA-224', (d) => h.sha224(d)],
    ['sha256', 'SHA-256', (d) => h.sha256(d)],
    ['sha384', 'SHA-384', (d) => h.sha384(d)],
    ['sha512', 'SHA-512', (d) => h.sha512(d)],
    ['sha3-224', 'SHA3-224', (d) => h.sha3(d, 224)],
    ['sha3-256', 'SHA3-256', (d) => h.sha3(d, 256)],
    ['sha3-384', 'SHA3-384', (d) => h.sha3(d, 384)],
    ['sha3-512', 'SHA3-512', (d) => h.sha3(d, 512)],
    ['keccak-256', 'Keccak-256', (d) => h.keccak(d, 256)],
    ['keccak-512', 'Keccak-512', (d) => h.keccak(d, 512)],
    ['blake2b', 'BLAKE2b-512', (d) => h.blake2b(d, 512)],
    ['blake2s', 'BLAKE2s-256', (d) => h.blake2s(d, 256)],
    ['blake3', 'BLAKE3', (d) => h.blake3(d)],
    ['ripemd160', 'RIPEMD-160', (d) => h.ripemd160(d)],
    ['xxh32', 'xxHash32', (d) => h.xxhash32(d)],
    ['xxh64', 'xxHash64', (d) => h.xxhash64(d)],
    ['xxh3', 'xxHash3', (d) => h.xxhash3(d)],
    ['xxh128', 'xxHash128', (d) => h.xxhash128(d)],
    ['crc32', 'CRC-32', (d) => h.crc32(d)],
  ];
}

export function inputBytes(input: string, format: InputFormat): Uint8Array {
  if (format === 'text') return utf8(input);
  if (format === 'hex') return hexToBytes(input);
  try {
    return base64ToBytes(input);
  } catch {
    throw new ToolError('Not valid Base64.');
  }
}

export async function hashAll(data: Uint8Array): Promise<HashResult[]> {
  const algos = await algorithms();
  const out: HashResult[] = [];
  for (const [id, label, fn] of algos) out.push({ id, label, hex: await fn(data) });
  return out;
}

export function formatDigest(hex: string, format: OutputFormat): string {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2) return hex;
  if (format === 'HEX') return hex.toUpperCase();
  if (format === 'base64') return bytesToBase64(hexToBytes(hex));
  return hex;
}

/** Hex digest of UTF-8 text with one algorithm (used by the Pipeline). */
export async function hashText(input: string, id: string): Promise<string> {
  const r = (await hashAll(utf8(input))).find((x) => x.id === id);
  if (!r) throw new ToolError(`Unknown hash algorithm "${id}".`);
  return r.hex;
}
