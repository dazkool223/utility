import { describe, expect, it } from 'vitest';
import { cleanToken, decodeJwtToken, jwtHeaderText, jwtPayloadText, jwtReport, relativeTime } from './logic';

const b64url = (o: unknown) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const make = (payload: unknown, header: unknown = { alg: 'HS256', typ: 'JWT' }) => `${b64url(header)}.${b64url(payload)}.c2ln`;
const NOW = Date.UTC(2025, 0, 1);

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('decodeJwtToken', () => {
  it('decodes the classic sample token', () => {
    const d = decodeJwtToken(SAMPLE, NOW);
    expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(d.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(d.alg).toBe('HS256');
    expect(d.claims).toEqual([{ claim: 'iat', seconds: 1516239022, iso: '2018-01-18T01:30:22.000Z' }]);
    expect(d.expiry).toBe('none');
  });
  it('flags expired and valid tokens', () => {
    expect(decodeJwtToken(make({ exp: NOW / 1000 - 60 }), NOW).expiry).toBe('expired');
    expect(decodeJwtToken(make({ exp: NOW / 1000 + 3600 }), NOW).expiry).toBe('valid');
  });
  it('flags tokens that are not valid yet', () => {
    expect(decodeJwtToken(make({ nbf: NOW / 1000 + 3600, exp: NOW / 1000 + 7200 }), NOW).expiry).toBe('not-yet-valid');
  });
  it('handles unicode claims', () => {
    expect((decodeJwtToken(make({ name: 'José ✓' })).payload as { name: string }).name).toBe('José ✓');
  });
  it('strips Bearer prefixes, quotes and line breaks', () => {
    expect(cleanToken(`Authorization: Bearer "${SAMPLE.slice(0, 20)}\n${SAMPLE.slice(20)}"`)).toBe(SAMPLE);
    expect(decodeJwtToken('Bearer ' + SAMPLE).alg).toBe('HS256');
  });
  it('gives readable header, payload and report text', () => {
    expect(jwtHeaderText(SAMPLE)).toContain('"alg": "HS256"');
    expect(jwtPayloadText(SAMPLE)).toContain('"name": "John Doe"');
    const report = jwtReport(make({ exp: NOW / 1000 - 86400 }), NOW);
    expect(report).toContain('exp: 2024-12-31T00:00:00.000Z (yesterday)');
    expect(report).toContain('Status: expired');
  });
  it('describes relative times', () => {
    expect(relativeTime(NOW / 1000 + 3 * 86400, NOW)).toBe('in 3 days');
    expect(relativeTime(NOW / 1000 - 7200, NOW)).toBe('2 hours ago');
  });
  it('rejects the wrong number of parts and bad encodings', () => {
    expect(() => decodeJwtToken('')).toThrow(/Paste a JWT/);
    expect(() => decodeJwtToken('a.b')).toThrow(/three parts/);
    expect(() => decodeJwtToken('a.b.c.d.e')).toThrow(/encrypted/);
    expect(() => decodeJwtToken('***.***.x')).toThrow(/not valid Base64URL/);
    expect(() => decodeJwtToken(`${b64url('x')}.${b64url('not json')}.x`)).toThrow();
    expect(() => decodeJwtToken(`${b64url('nope')}.${b64url({})}.x`)).toThrow(/header is not valid JSON/);
  });
  it('handles a very large payload', () => {
    const d = decodeJwtToken(make({ blob: 'x'.repeat(2_000_000) }));
    expect((d.payload as { blob: string }).blob).toHaveLength(2_000_000);
  });
});
