import { ToolError } from '@/core/types';
import { toPem } from '../_lib/bytes';

export type RsaUse = 'rsa-oaep' | 'rsa-pss' | 'rsa-pkcs1';
export type KeyFormat = 'pem' | 'jwk';

export interface RsaOptions {
  bits: 2048 | 3072 | 4096;
  use: RsaUse;
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
}

const NAMES: Record<RsaUse, string> = { 'rsa-oaep': 'RSA-OAEP', 'rsa-pss': 'RSA-PSS', 'rsa-pkcs1': 'RSASSA-PKCS1-v1_5' };

export interface RsaKeyPair {
  privatePkcs8: Uint8Array;
  publicSpki: Uint8Array;
  privateJwk: JsonWebKey;
  publicJwk: JsonWebKey;
}

/** Generates a key pair with Web Crypto. 4096-bit keys can take several seconds, so call this from a Worker. */
export async function generateRsa(o: RsaOptions): Promise<RsaKeyPair> {
  if (![2048, 3072, 4096].includes(o.bits)) throw new ToolError('Key size must be 2048, 3072 or 4096 bits.');
  const usages: KeyUsage[] = o.use === 'rsa-oaep' ? ['encrypt', 'decrypt'] : ['sign', 'verify'];
  const pair = await crypto.subtle.generateKey(
    { name: NAMES[o.use], modulusLength: o.bits, publicExponent: new Uint8Array([1, 0, 1]), hash: o.hash },
    true,
    usages,
  );
  const [pkcs8, spki, privateJwk, publicJwk] = await Promise.all([
    crypto.subtle.exportKey('pkcs8', pair.privateKey),
    crypto.subtle.exportKey('spki', pair.publicKey),
    crypto.subtle.exportKey('jwk', pair.privateKey),
    crypto.subtle.exportKey('jwk', pair.publicKey),
  ]);
  return { privatePkcs8: new Uint8Array(pkcs8), publicSpki: new Uint8Array(spki), privateJwk, publicJwk };
}

export function formatKeyPair(k: RsaKeyPair, format: KeyFormat): string {
  if (format === 'jwk') return `${JSON.stringify(k.privateJwk, null, 2)}\n\n${JSON.stringify(k.publicJwk, null, 2)}`;
  return `${toPem('PRIVATE KEY', k.privatePkcs8)}\n\n${toPem('PUBLIC KEY', k.publicSpki)}`;
}
