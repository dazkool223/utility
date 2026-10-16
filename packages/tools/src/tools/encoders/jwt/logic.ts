import { ToolError } from '@/core/types';
import { base64ToBytes } from '../base64/logic';

export type Expiry = 'expired' | 'valid' | 'not-yet-valid' | 'none';

export interface TimeClaim {
  claim: 'exp' | 'iat' | 'nbf';
  seconds: number;
  iso: string;
}

export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
  alg: string | null;
  claims: TimeClaim[];
  expiry: Expiry;
}

function decodePart(part: string, what: string): unknown {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*$/.test(b64) || b64.length % 4 === 1) throw new ToolError(`The ${what} is not valid Base64URL.`);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
  } catch {
    throw new ToolError(`The ${what} is not valid UTF-8 text.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ToolError(`The ${what} is not valid JSON.`);
  }
}

/** Remove a "Bearer " prefix, quotes and whitespace people usually paste along with a token. */
export function cleanToken(input: string): string {
  return input
    .trim()
    .replace(/^authorization:\s*/i, '')
    .replace(/^bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '');
}

/** Decode a JWT without verifying its signature. `now` is in milliseconds. */
export function decodeJwtToken(input: string, now: number = Date.now()): DecodedJwt {
  const token = cleanToken(input);
  if (!token) throw new ToolError('Paste a JWT: three Base64URL parts separated by dots.');
  const parts = token.split('.');
  if (parts.length === 5) throw new ToolError('This looks like an encrypted JWT (JWE) with five parts. Its contents cannot be read without the key.');
  if (parts.length !== 3) throw new ToolError(`A JWT has three parts separated by dots, but this has ${parts.length}.`);
  const header = decodePart(parts[0]!, 'header');
  const payload = decodePart(parts[1]!, 'payload');
  const alg = header && typeof header === 'object' && typeof (header as Record<string, unknown>).alg === 'string' ? String((header as Record<string, unknown>).alg) : null;
  const claims: TimeClaim[] = [];
  let expiry: Expiry = 'none';
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    for (const claim of ['exp', 'iat', 'nbf'] as const) {
      const v = p[claim];
      if (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 8.64e12) claims.push({ claim, seconds: v, iso: new Date(v * 1000).toISOString() });
    }
    const exp = claims.find((c) => c.claim === 'exp');
    const nbf = claims.find((c) => c.claim === 'nbf');
    if (exp) expiry = exp.seconds * 1000 <= now ? 'expired' : 'valid';
    if (expiry !== 'expired' && nbf && nbf.seconds * 1000 > now) expiry = 'not-yet-valid';
  }
  return { header, payload, signature: parts[2]!, alg, claims, expiry };
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** "in 3 days" / "2 hours ago". */
export function relativeTime(seconds: number, nowMs: number = Date.now()): string {
  const diff = Math.round(seconds - nowMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') return rtf.format(Math.round(diff / size), unit);
  }
  return '';
}

export const pretty = (v: unknown) => JSON.stringify(v, null, 2);

export function jwtHeaderText(input: string): string {
  return pretty(decodeJwtToken(input).header);
}

export function jwtPayloadText(input: string): string {
  return pretty(decodeJwtToken(input).payload);
}

/** Plain-text report, used by the Pipeline and for copying. */
export function jwtReport(input: string, now: number = Date.now()): string {
  const d = decodeJwtToken(input, now);
  const lines = ['Header', pretty(d.header), '', 'Payload', pretty(d.payload)];
  if (d.claims.length) {
    lines.push('', 'Times (UTC)');
    for (const c of d.claims) lines.push(`${c.claim}: ${c.iso} (${relativeTime(c.seconds, now)})`);
  }
  if (d.expiry === 'expired') lines.push('', 'Status: expired');
  if (d.expiry === 'valid') lines.push('', 'Status: not expired');
  if (d.expiry === 'not-yet-valid') lines.push('', 'Status: not valid yet (nbf is in the future)');
  lines.push('', 'The signature is not verified.');
  return lines.join('\n');
}
