import { describe, expect, it } from 'vitest';
import * as O from 'otpauth';
import { DEFAULT_PARAMS, generateOtp, parseOtpUri, randomSecret, validateOtp, type OtpParams } from './logic';

const b32 = (ascii: string) => O.Secret.fromUTF8(ascii).base32;
const S1 = b32('12345678901234567890');
const S256 = b32('12345678901234567890123456789012');
const S512 = b32('1234567890123456789012345678901234567890123456789012345678901234');
const p = (o: Partial<OtpParams>): OtpParams => ({ ...DEFAULT_PARAMS, ...o });

describe('TOTP (RFC 6238 appendix B)', () => {
  const cases: Array<[number, OtpParams['algorithm'], string, string]> = [
    [59, 'SHA1', S1, '94287082'],
    [59, 'SHA256', S256, '46119246'],
    [59, 'SHA512', S512, '90693936'],
    [1111111109, 'SHA1', S1, '07081804'],
    [1111111109, 'SHA256', S256, '68084774'],
    [20000000000, 'SHA1', S1, '65353130'],
  ];
  for (const [t, algorithm, secret, code] of cases) {
    it(`${algorithm} at T=${t} is ${code}`, async () => {
      const r = await generateOtp(p({ algorithm, secret, digits: 8 }), t * 1000);
      expect(r.code).toBe(code);
    });
  }
  it('reports seconds left and neighbouring codes', async () => {
    const r = await generateOtp(p({ secret: S1 }), 59_000);
    expect(r.secondsLeft).toBe(1);
    expect(r.previous).toBeTruthy();
    expect(r.next).not.toBe(r.code);
  });
  it('builds a standard otpauth URI and round-trips it', async () => {
    const r = await generateOtp(p({ secret: 'JBSWY3DPEHPK3PXP', issuer: 'Example', label: 'alice@example.com' }), 0);
    expect(r.uri).toBe('otpauth://totp/Example:alice%40example.com?issuer=Example&secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30');
    const back = await parseOtpUri(r.uri);
    expect(back).toMatchObject({ type: 'totp', secret: 'JBSWY3DPEHPK3PXP', issuer: 'Example', digits: 6, period: 30 });
  });
});

describe('HOTP (RFC 4226 appendix D)', () => {
  it('generates the published sequence', async () => {
    const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
    for (let i = 0; i < expected.length; i++) {
      const r = await generateOtp(p({ type: 'hotp', secret: S1, counter: i }), 0);
      expect(r.code).toBe(expected[i]);
    }
  });
});

describe('validateOtp', () => {
  it('accepts the current, previous and next code within the window', async () => {
    const now = 1_700_000_000_000;
    const r = await generateOtp(p({ secret: S1 }), now);
    expect(await validateOtp(p({ secret: S1 }), r.code, now, 1)).toBe(0);
    expect(await validateOtp(p({ secret: S1 }), r.previous!, now, 1)).toBe(-1);
    expect(await validateOtp(p({ secret: S1 }), r.next!, now, 1)).toBe(1);
    expect(await validateOtp(p({ secret: S1 }), r.previous!, now, 0)).toBeNull();
  });
  it('validates HOTP with a look-ahead window', async () => {
    expect(await validateOtp(p({ type: 'hotp', secret: S1, counter: 0 }), '359152', 0, 5)).toBe(2);
  });
  it('rejects malformed codes', async () => {
    await expect(validateOtp(p({ secret: S1 }), '12ab56', 0, 1)).rejects.toThrow(/digits only/);
    await expect(validateOtp(p({ secret: S1 }), '123', 0, 1)).rejects.toThrow(/6 digits/);
  });
});

describe('input checking', () => {
  it('gives plain errors', async () => {
    await expect(generateOtp(p({ secret: '' }), 0)).rejects.toThrow(/Enter a Base32/);
    await expect(generateOtp(p({ secret: 'not base32!!' }), 0)).rejects.toThrow(/not valid Base32/);
    await expect(generateOtp(p({ secret: 'ABC' }), 0)).rejects.toThrow(/too short/);
    await expect(generateOtp(p({ secret: S1, digits: 5 }), 0)).rejects.toThrow(/Digits/);
    await expect(parseOtpUri('otpauth://bogus')).rejects.toThrow(/could not be read/);
  });
  it('tolerates spaces, dashes and lowercase in the secret', async () => {
    const a = await generateOtp(p({ secret: 'jbsw y3dp-ehpk 3pxp' }), 1e12);
    const b = await generateOtp(p({ secret: 'JBSWY3DPEHPK3PXP' }), 1e12);
    expect(a.code).toBe(b.code);
  });
  it('random secrets are valid Base32 and different', async () => {
    const a = await randomSecret();
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
    expect(await randomSecret()).not.toBe(a);
  });
});
