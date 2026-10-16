import { ToolError } from '@/core/types';

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(bytes: Uint8Array, upper = false, sep = ''): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += (i && sep ? sep : '') + HEX[bytes[i]!];
  return upper ? out.toUpperCase() : out;
}

/** Parses hex with optional whitespace, `:` `-` separators and a 0x prefix. */
export function hexToBytes(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.trim().replace(/^0x/i, '').replace(/[\s:,-]|0x/gi, '');
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) throw new ToolError('Not valid hex: use an even number of digits 0-9 and a-f.');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const clean = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.replace(/=+$/, '').length % 4 === 1) throw new ToolError('Not valid Base64.');
  const body = clean.replace(/=+$/, '');
  const binary = atob(body + '='.repeat((4 - (body.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const utf8 = (s: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(s);

/** Wraps Base64 at 64 characters inside PEM armour. */
export function toPem(label: string, der: Uint8Array): string {
  const b64 = bytesToBase64(der).match(/.{1,64}/g)?.join('\n') ?? '';
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`;
}

export interface PemBlock {
  label: string;
  der: Uint8Array<ArrayBuffer>;
}

/** Extracts every PEM block from `text`. */
export function parsePem(text: string): PemBlock[] {
  const out: PemBlock[] = [];
  const re = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const body = m[2]!.split('\n').filter((l) => !l.includes(':')).join('');
    try {
      out.push({ label: m[1]!, der: base64ToBytes(body) });
    } catch {
      throw new ToolError(`The ${m[1]} block is not valid Base64.`);
    }
  }
  return out;
}

/** Random integer in [0, max) using rejection sampling, so there is no modulo bias. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError('max must be an integer in 1..2^32');
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0]! < limit) return buf[0]! % max;
  }
}

export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  return out;
}

/** Copies into a fresh ArrayBuffer-backed view (satisfies strict BufferSource typing). */
export function buf(b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(b.length);
  out.set(b);
  return out;
}
