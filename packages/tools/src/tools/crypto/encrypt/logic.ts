import { ToolError } from '@/core/types';
import { base64ToBytes, bytesToBase64Url, buf, randomBytes, utf8 } from '../_lib/bytes';

export type Cipher = 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
export const CIPHERS: Cipher[] = ['AES-GCM', 'AES-CBC', 'AES-CTR'];
export const DEFAULT_ITERATIONS = 600_000;
export const MAX_ITERATIONS = 10_000_000;

const PREFIX = 'utl1';
const SALT_LEN = 16;

/**
 * Output format (all fields Base64URL, joined with "."):
 *   utl1.<cipher>.<iterations>.<salt>.<iv>.<ciphertext>[.<mac>]
 * The key comes from PBKDF2-HMAC-SHA-256. GCM is authenticated by itself. CBC and CTR derive a second key and
 * add an HMAC-SHA-256 (encrypt-then-MAC) over everything before it, so a wrong password or tampering is detected.
 */
export interface EncryptOptions {
  cipher: Cipher;
  iterations: number;
  /** Test hooks. */
  salt?: Uint8Array;
  iv?: Uint8Array;
}

async function derive(pass: string, salt: Uint8Array, iterations: number, cipher: Cipher): Promise<{ key: CryptoKey; mac?: CryptoKey }> {
  const base = await crypto.subtle.importKey('raw', buf(utf8(pass)), 'PBKDF2', false, ['deriveBits']);
  const needMac = cipher !== 'AES-GCM';
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: buf(salt), iterations }, base, needMac ? 512 : 256));
  const usage: KeyUsage[] = ['encrypt', 'decrypt'];
  const key = await crypto.subtle.importKey('raw', buf(bits.subarray(0, 32)), cipher, false, usage);
  if (!needMac) return { key };
  const mac = await crypto.subtle.importKey('raw', buf(bits.subarray(32)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return { key, mac };
}

function params(cipher: Cipher, iv: Uint8Array): AesGcmParams | AesCbcParams | AesCtrParams {
  if (cipher === 'AES-CTR') return { name: 'AES-CTR', counter: buf(iv), length: 64 };
  return { name: cipher, iv: buf(iv) };
}

const ivLength = (c: Cipher) => (c === 'AES-GCM' ? 12 : 16);
const join = (...p: string[]) => p.join('.');

export async function encryptText(plain: string, pass: string, o: EncryptOptions): Promise<string> {
  if (!pass) throw new ToolError('Enter a passphrase.');
  if (!Number.isInteger(o.iterations) || o.iterations < 1000 || o.iterations > MAX_ITERATIONS)
    throw new ToolError(`Iterations must be a whole number between 1,000 and ${MAX_ITERATIONS.toLocaleString('en')}.`);
  const salt = o.salt ?? randomBytes(SALT_LEN);
  const iv = o.iv ?? randomBytes(ivLength(o.cipher));
  const { key, mac } = await derive(pass, salt, o.iterations, o.cipher);
  const ct = new Uint8Array(await crypto.subtle.encrypt(params(o.cipher, iv), key, buf(utf8(plain))));
  const head = join(PREFIX, o.cipher, String(o.iterations), bytesToBase64Url(salt), bytesToBase64Url(iv), bytesToBase64Url(ct));
  if (!mac) return head;
  const tag = new Uint8Array(await crypto.subtle.sign('HMAC', mac, buf(utf8(head))));
  return join(head, bytesToBase64Url(tag));
}

export async function decryptText(token: string, pass: string): Promise<string> {
  const parts = token.trim().split('.');
  if (parts[0] !== PREFIX || parts.length < 6) throw new ToolError('This is not text produced by this Tool (it should start with "utl1.").');
  const cipher = parts[1] as Cipher;
  if (!CIPHERS.includes(cipher)) throw new ToolError(`Unknown cipher "${parts[1]}".`);
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) throw new ToolError('The iteration count in the header is invalid.');
  if (!pass) throw new ToolError('Enter the passphrase.');
  const authed = cipher !== 'AES-GCM';
  if (parts.length !== (authed ? 7 : 6)) throw new ToolError('The encrypted text is incomplete or has extra parts.');
  let salt: Uint8Array, iv: Uint8Array, ct: Uint8Array, tag: Uint8Array | undefined;
  try {
    salt = base64ToBytes(parts[3]!);
    iv = base64ToBytes(parts[4]!);
    ct = base64ToBytes(parts[5]!);
    tag = authed ? base64ToBytes(parts[6]!) : undefined;
  } catch {
    throw new ToolError('The encrypted text is damaged (invalid Base64URL).');
  }
  if (iv.length !== ivLength(cipher)) throw new ToolError('The encrypted text is damaged (wrong IV length).');
  const wrong = new ToolError('Decryption failed: wrong passphrase, or the text was changed.');
  const { key, mac } = await derive(pass, salt, iterations, cipher);
  if (mac && tag) {
    const ok = await crypto.subtle.verify('HMAC', mac, buf(tag), buf(utf8(parts.slice(0, 6).join('.')))).catch(() => false);
    if (!ok) throw wrong;
  }
  try {
    const pt = await crypto.subtle.decrypt(params(cipher, iv), key, buf(ct));
    return new TextDecoder('utf-8', { fatal: true }).decode(pt);
  } catch {
    throw wrong;
  }
}
