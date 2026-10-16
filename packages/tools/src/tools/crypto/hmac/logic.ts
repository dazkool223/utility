import { ToolError } from '@/core/types';
import { base64ToBytes, hexToBytes, utf8 } from '../_lib/bytes';

export type KeyFormat = 'text' | 'hex' | 'base64';

export const HMAC_ALGOS = [
  ['md5', 'HMAC-MD5'],
  ['sha1', 'HMAC-SHA-1'],
  ['sha224', 'HMAC-SHA-224'],
  ['sha256', 'HMAC-SHA-256'],
  ['sha384', 'HMAC-SHA-384'],
  ['sha512', 'HMAC-SHA-512'],
  ['sha3-256', 'HMAC-SHA3-256'],
  ['sha3-512', 'HMAC-SHA3-512'],
  ['ripemd160', 'HMAC-RIPEMD-160'],
] as const;

export function keyBytes(key: string, format: KeyFormat): Uint8Array {
  if (format === 'text') return utf8(key);
  if (format === 'hex') return hexToBytes(key);
  try {
    return base64ToBytes(key);
  } catch {
    throw new ToolError('The key is not valid Base64.');
  }
}

export async function hmac(algo: string, key: Uint8Array, message: Uint8Array): Promise<string> {
  const h = await import('hash-wasm');
  const make: Record<string, () => Promise<import('hash-wasm').IHasher>> = {
    md5: () => h.createMD5(),
    sha1: () => h.createSHA1(),
    sha224: () => h.createSHA224(),
    sha256: () => h.createSHA256(),
    sha384: () => h.createSHA384(),
    sha512: () => h.createSHA512(),
    'sha3-256': () => h.createSHA3(256),
    'sha3-512': () => h.createSHA3(512),
    ripemd160: () => h.createRIPEMD160(),
  };
  const factory = make[algo];
  if (!factory) throw new ToolError(`Unknown algorithm "${algo}".`);
  const hasher = await h.createHMAC(factory(), key);
  hasher.init();
  hasher.update(message);
  return hasher.digest('hex');
}

export async function hmacAll(key: Uint8Array, message: Uint8Array): Promise<Array<[string, string]>> {
  const out: Array<[string, string]> = [];
  for (const [id, label] of HMAC_ALGOS) out.push([label, await hmac(id, key, message)]);
  return out;
}
