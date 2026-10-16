import { ToolError } from '@/core/types';
import { base64ToBytes, buf, bytesToBase64, bytesToHex, hexToBytes, parsePem, toPem } from '../_lib/bytes';

// --- minimal DER writer, enough to wrap PKCS#1 keys ---
function lenBytes(n: number): number[] {
  if (n < 128) return [n];
  const out: number[] = [];
  for (let v = n; v > 0; v = Math.floor(v / 256)) out.unshift(v & 255);
  return [0x80 | out.length, ...out];
}
function tlv(tag: number, content: Uint8Array): Uint8Array<ArrayBuffer> {
  const l = lenBytes(content.length);
  const out = new Uint8Array(1 + l.length + content.length);
  out[0] = tag;
  out.set(l, 1);
  out.set(content, 1 + l.length);
  return out;
}
const concat = (...p: Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) {
    out.set(x, o);
    o += x.length;
  }
  return out;
};
const RSA_ALG_ID = Uint8Array.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);

export function pkcs1PrivateToPkcs8(der: Uint8Array): Uint8Array<ArrayBuffer> {
  return tlv(0x30, concat(Uint8Array.from([0x02, 0x01, 0x00]), RSA_ALG_ID, tlv(0x04, der)));
}
export function pkcs1PublicToSpki(der: Uint8Array): Uint8Array<ArrayBuffer> {
  return tlv(0x30, concat(RSA_ALG_ID, tlv(0x03, concat(Uint8Array.from([0]), der))));
}

export type KeyKind = { kind: 'rsa' } | { kind: 'ec'; curve: 'P-256' | 'P-384' | 'P-521' } | { kind: 'ed25519' } | { kind: 'x25519' };

function has(der: Uint8Array, pattern: number[]): boolean {
  const limit = Math.min(der.length, 80) - pattern.length;
  outer: for (let i = 0; i <= limit; i++) {
    for (let j = 0; j < pattern.length; j++) if (der[i + j] !== pattern[j]) continue outer;
    return true;
  }
  return false;
}

/** Recognises the key algorithm from the OIDs near the start of a PKCS#8 or SPKI structure. */
export function detectKey(der: Uint8Array): KeyKind | null {
  if (has(der, [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01])) return { kind: 'rsa' };
  if (has(der, [0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01])) {
    if (has(der, [0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])) return { kind: 'ec', curve: 'P-256' };
    if (has(der, [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22])) return { kind: 'ec', curve: 'P-384' };
    if (has(der, [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23])) return { kind: 'ec', curve: 'P-521' };
    return null;
  }
  if (has(der, [0x06, 0x03, 0x2b, 0x65, 0x70])) return { kind: 'ed25519' };
  if (has(der, [0x06, 0x03, 0x2b, 0x65, 0x6e])) return { kind: 'x25519' };
  return null;
}

function importParams(k: KeyKind): { alg: RsaHashedImportParams | EcKeyImportParams | Algorithm; usages: { pub: KeyUsage[]; priv: KeyUsage[] } } {
  switch (k.kind) {
    case 'rsa': return { alg: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, usages: { pub: ['verify'], priv: ['sign'] } };
    case 'ec': return { alg: { name: 'ECDSA', namedCurve: k.curve }, usages: { pub: ['verify'], priv: ['sign'] } };
    case 'ed25519': return { alg: { name: 'Ed25519' }, usages: { pub: ['verify'], priv: ['sign'] } };
    case 'x25519': return { alg: { name: 'X25519' }, usages: { pub: [], priv: ['deriveBits'] } };
  }
}

function cleanJwk(j: JsonWebKey): JsonWebKey {
  const { alg: _a, key_ops: _k, ext: _e, ...rest } = j;
  return rest;
}

export async function derKeyToJwk(der: Uint8Array, isPrivate: boolean): Promise<{ jwk: JsonWebKey; description: string }> {
  const kind = detectKey(der);
  if (!kind) throw new ToolError('This key type is not supported. RSA, ECDSA (P-256/384/521), Ed25519 and X25519 keys can be converted.');
  const { alg, usages } = importParams(kind);
  try {
    const key = await crypto.subtle.importKey(isPrivate ? 'pkcs8' : 'spki', buf(der), alg, true, isPrivate ? usages.priv : usages.pub);
    const jwk = cleanJwk(await crypto.subtle.exportKey('jwk', key));
    const desc = kind.kind === 'rsa' ? 'RSA' : kind.kind === 'ec' ? `EC ${kind.curve}` : kind.kind === 'ed25519' ? 'Ed25519' : 'X25519';
    return { jwk, description: desc };
  } catch {
    // Some runtimes don't import Ed25519 or X25519 for the requested usages.
    throw new ToolError(`This browser could not read the ${kind.kind.toUpperCase()} key. The key may be damaged or its type may not be supported here.`);
  }
}

const KEY_LABELS = ['PUBLIC KEY', 'PRIVATE KEY', 'RSA PRIVATE KEY', 'RSA PUBLIC KEY'];

/** PEM (any number of blocks) -> DER in Base64 and hex, plus JWK for keys. */
export async function pemToDer(input: string): Promise<string> {
  const blocks = parsePem(input);
  if (!blocks.length) throw new ToolError('No PEM block found. It should start with -----BEGIN ...----- and end with -----END ...-----.');
  const out: string[] = [];
  for (const b of blocks) {
    const lines = [`# ${b.label} (${b.der.length} bytes)`, `DER (Base64): ${bytesToBase64(b.der)}`, `DER (hex): ${bytesToHex(b.der)}`];
    if (KEY_LABELS.includes(b.label)) {
      let der = b.der;
      let priv = b.label.includes('PRIVATE');
      if (b.label === 'RSA PRIVATE KEY') der = pkcs1PrivateToPkcs8(der);
      if (b.label === 'RSA PUBLIC KEY') der = pkcs1PublicToSpki(der);
      const { jwk, description } = await derKeyToJwk(der, priv);
      lines[0] += ` - ${description}`;
      lines.push(`JWK:\n${JSON.stringify(jwk, null, 2)}`);
    }
    out.push(lines.join('\n'));
  }
  return out.join('\n\n');
}

export function detectDerEncoding(input: string): 'hex' | 'base64' {
  const s = input.replace(/[\s:]/g, '').replace(/^0x/i, '');
  return /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0 && s.startsWith('30') ? 'hex' : 'base64';
}

export const PEM_LABELS = ['CERTIFICATE', 'PUBLIC KEY', 'PRIVATE KEY', 'RSA PRIVATE KEY', 'RSA PUBLIC KEY', 'EC PRIVATE KEY', 'CERTIFICATE REQUEST', 'X509 CRL'] as const;

/** Hex or Base64 DER -> PEM with the chosen label. */
export function derToPem(input: string, label: string): string {
  const s = input.trim();
  if (!s) throw new ToolError('Paste DER bytes as hex or Base64.');
  let der: Uint8Array;
  if (detectDerEncoding(s) === 'hex') der = hexToBytes(s);
  else {
    try {
      der = base64ToBytes(s);
    } catch {
      throw new ToolError('The input is neither valid hex nor valid Base64.');
    }
  }
  if (der.length < 2 || der[0] !== 0x30) throw new ToolError('This is not DER: an X.509 or key structure starts with the byte 0x30 (hex "30").');
  return toPem(label, der);
}

/** JWK JSON -> SPKI or PKCS#8 PEM. */
export async function jwkToPem(input: string): Promise<string> {
  let jwk: JsonWebKey;
  try {
    jwk = JSON.parse(input) as JsonWebKey;
  } catch {
    throw new ToolError('That is not valid JSON.');
  }
  if (!jwk || typeof jwk !== 'object' || !jwk.kty) throw new ToolError('A JWK needs a "kty" field (RSA, EC or OKP).');
  let alg: Algorithm | RsaHashedImportParams | EcKeyImportParams;
  if (jwk.kty === 'RSA') alg = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  else if (jwk.kty === 'EC') alg = { name: 'ECDSA', namedCurve: jwk.crv ?? '' };
  else if (jwk.kty === 'OKP' && (jwk.crv === 'Ed25519' || jwk.crv === 'X25519')) alg = { name: jwk.crv };
  else throw new ToolError(`Unsupported JWK type "${jwk.kty}${jwk.crv ? ' / ' + jwk.crv : ''}". Supported: RSA, EC (P-256/384/521), OKP (Ed25519, X25519).`);
  const isPrivate = !!jwk.d;
  const clean = { ...jwk };
  delete clean.alg;
  delete clean.use;
  delete clean.key_ops;
  delete clean.ext;
  let usages: KeyUsage[];
  if (jwk.crv === 'X25519') usages = isPrivate ? ['deriveBits'] : [];
  else usages = isPrivate ? ['sign'] : ['verify'];
  try {
    const key = await crypto.subtle.importKey('jwk', clean, alg, true, usages);
    const der = new Uint8Array(await crypto.subtle.exportKey(isPrivate ? 'pkcs8' : 'spki', key));
    return toPem(isPrivate ? 'PRIVATE KEY' : 'PUBLIC KEY', der);
  } catch {
    throw new ToolError('This JWK could not be imported. Check that all the key fields for its type are present and valid.');
  }
}
