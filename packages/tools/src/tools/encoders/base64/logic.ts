import { ToolError } from '@/core/types';

/** Encode bytes to Base64 without hitting call-stack limits on large inputs. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function encodeBase64(text: string, urlSafe: boolean): string {
  const b64 = bytesToBase64(new TextEncoder().encode(text));
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

/** Decodes standard or URL-safe Base64 (padding optional, whitespace ignored) as UTF-8. */
export function decodeBase64(input: string): string {
  const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new ToolError('Not valid Base64: only A–Z, a–z, 0–9, +, /, - and _ are allowed.');
  const body = clean.replace(/=+$/, '');
  if (body.length % 4 === 1) throw new ToolError('Not valid Base64: the length is wrong (a character is missing or extra).');
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(body + '='.repeat((4 - (body.length % 4)) % 4));
  } catch {
    throw new ToolError('Not valid Base64.');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError('The decoded bytes are not valid UTF-8 text. If this is a file, use the Base64 file tool.');
  }
}
