import { ToolError } from '@/core/types';

export type OtpType = 'totp' | 'hotp';
export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface OtpParams {
  type: OtpType;
  /** Base32 secret (spaces, dashes and lowercase are fine). */
  secret: string;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  issuer: string;
  label: string;
}

export const DEFAULT_PARAMS: OtpParams = { type: 'totp', secret: '', algorithm: 'SHA1', digits: 6, period: 30, counter: 0, issuer: '', label: 'account' };

export function cleanSecret(s: string): string {
  return s.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
}

function check(p: OtpParams): void {
  const secret = cleanSecret(p.secret);
  if (!secret) throw new ToolError('Enter a Base32 secret, or paste an otpauth:// link.');
  if (!/^[A-Z2-7]+$/.test(secret)) throw new ToolError('The secret is not valid Base32. Only the letters A-Z and the digits 2-7 are allowed.');
  if (secret.length < 8) throw new ToolError('The secret is too short (at least 8 Base32 characters).');
  if (![6, 7, 8].includes(p.digits)) throw new ToolError('Digits must be 6, 7 or 8.');
  if (p.type === 'totp' && !(Number.isInteger(p.period) && p.period >= 1 && p.period <= 3600)) throw new ToolError('The period must be 1 to 3600 seconds.');
  if (p.type === 'hotp' && !(Number.isInteger(p.counter) && p.counter >= 0)) throw new ToolError('The counter must be a whole number, 0 or more.');
}

async function build(p: OtpParams) {
  check(p);
  const O = await import('otpauth');
  const common = {
    issuer: p.issuer || undefined,
    label: p.label || 'account',
    algorithm: p.algorithm,
    digits: p.digits,
    secret: O.Secret.fromBase32(cleanSecret(p.secret)),
  };
  return p.type === 'totp' ? new O.TOTP({ ...common, period: p.period }) : new O.HOTP({ ...common, counter: p.counter });
}

export interface OtpResult {
  code: string;
  uri: string;
  /** TOTP only. */
  secondsLeft?: number;
  previous?: string;
  next?: string;
}

export async function generateOtp(p: OtpParams, nowMs: number): Promise<OtpResult> {
  const otp = await build(p);
  const uri = otp.toString();
  if (otp.constructor.name === 'HOTP' || p.type === 'hotp') {
    const h = otp as import('otpauth').HOTP;
    return { code: h.generate({ counter: p.counter }), uri, next: h.generate({ counter: p.counter + 1 }) };
  }
  const t = otp as import('otpauth').TOTP;
  return {
    code: t.generate({ timestamp: nowMs }),
    uri,
    secondsLeft: Math.ceil((p.period * 1000 - (nowMs % (p.period * 1000))) / 1000),
    previous: t.generate({ timestamp: nowMs - p.period * 1000 }),
    next: t.generate({ timestamp: nowMs + p.period * 1000 }),
  };
}

/** Checks `token` within +/- `window` steps. Returns the matching step offset, or null. */
export async function validateOtp(p: OtpParams, token: string, nowMs: number, window: number): Promise<number | null> {
  const t = token.replace(/\s/g, '');
  if (!/^\d+$/.test(t)) throw new ToolError('The code should contain digits only.');
  if (t.length !== p.digits) throw new ToolError(`The code should have ${p.digits} digits; this has ${t.length}.`);
  const otp = await build(p);
  const w = Math.max(0, Math.min(10, Math.floor(window)));
  if (p.type === 'hotp') {
    const delta = (otp as import('otpauth').HOTP).validate({ token: t, counter: p.counter, window: w });
    return delta;
  }
  return (otp as import('otpauth').TOTP).validate({ token: t, timestamp: nowMs, window: w });
}

/** Parses an otpauth:// URI into params. */
export async function parseOtpUri(uri: string): Promise<OtpParams> {
  const O = await import('otpauth');
  let o: InstanceType<typeof O.TOTP> | InstanceType<typeof O.HOTP>;
  try {
    o = O.URI.parse(uri.trim()) as typeof o;
  } catch {
    throw new ToolError('That otpauth:// link could not be read. Check that it contains a secret parameter.');
  }
  const isTotp = o instanceof O.TOTP;
  return {
    type: isTotp ? 'totp' : 'hotp',
    secret: o.secret.base32,
    algorithm: (['SHA1', 'SHA256', 'SHA512'].includes(o.algorithm) ? o.algorithm : 'SHA1') as OtpAlgorithm,
    digits: o.digits,
    period: isTotp ? (o as InstanceType<typeof O.TOTP>).period : 30,
    counter: isTotp ? 0 : (o as InstanceType<typeof O.HOTP>).counter,
    issuer: o.issuer,
    label: o.label,
  };
}

export async function randomSecret(bytes = 20): Promise<string> {
  const O = await import('otpauth');
  return new O.Secret({ buffer: crypto.getRandomValues(new Uint8Array(bytes)).buffer }).base32;
}
