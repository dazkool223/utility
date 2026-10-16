import { describe, expect, it } from 'vitest';
import { toPem } from '../_lib/bytes';
import { describeCertificates, derBlocks } from './logic';

async function makeCert(cn: string, notBefore: Date, notAfter: Date) {
  const x = await (await import('../_lib/x509')).loadX509();
  const alg = { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };
  const keys = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
  const cert = await x.X509CertificateGenerator.createSelfSigned({
    serialNumber: '0A1B2C',
    name: `CN=${cn}, O=Utility Test`,
    notBefore,
    notAfter,
    signingAlgorithm: alg,
    keys,
    extensions: [
      new x.BasicConstraintsExtension(true, 2, true),
      new x.KeyUsagesExtension(x.KeyUsageFlags.keyCertSign | x.KeyUsageFlags.digitalSignature, true),
      new x.SubjectAlternativeNameExtension([
        { type: 'dns', value: cn },
        { type: 'dns', value: `www.${cn}` },
      ]),
    ],
  });
  return toPem('CERTIFICATE', new Uint8Array(cert.rawData));
}

const get = (rows: Array<[string, string]>, k: string) => rows.find(([key]) => key === k)?.[1];

describe('describeCertificates', () => {
  it('decodes subject, issuer, validity, SAN, constraints and fingerprints', async () => {
    const pem = await makeCert('example.test', new Date('2024-01-01T00:00:00Z'), new Date('2030-01-01T00:00:00Z'));
    const rows = await describeCertificates(pem, new Date('2026-01-01T00:00:00Z'));
    expect(get(rows, 'Subject')).toContain('CN=example.test');
    expect(get(rows, 'Self-signed')).toMatch(/^yes/);
    expect(get(rows, 'Serial number')).toBe('0A1B2C');
    expect(get(rows, 'Not before')).toBe('2024-01-01T00:00:00.000Z');
    expect(get(rows, 'Not after')).toBe('2030-01-01T00:00:00.000Z');
    expect(get(rows, 'Status')).toMatch(/^Valid, expires in 1461 days/);
    expect(get(rows, 'Signature algorithm')).toContain('ECDSA');
    expect(get(rows, 'Subject alt names')).toBe('dns:example.test\ndns:www.example.test');
    expect(get(rows, 'Basic constraints')).toBe('CA: yes, path length 2');
    expect(get(rows, 'Key usage')).toContain('keyCertSign');
    expect(get(rows, 'SHA-256 fingerprint')).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(get(rows, 'SHA-1 fingerprint')).toMatch(/^([0-9A-F]{2}:){19}[0-9A-F]{2}$/);
  });
  it('reports expired and not-yet-valid certificates', async () => {
    const pem = await makeCert('old.test', new Date('2020-01-01T00:00:00Z'), new Date('2021-01-01T00:00:00Z'));
    expect(get(await describeCertificates(pem, new Date('2022-01-01T00:00:00Z')), 'Status')).toMatch(/^Expired 365 days ago/);
    expect(get(await describeCertificates(pem, new Date('2019-01-01T00:00:00Z')), 'Status')).toBe('Not yet valid');
  });
  it('handles a chain of several certificates and bare Base64 DER', async () => {
    const a = await makeCert('a.test', new Date('2024-01-01Z'), new Date('2030-01-01Z'));
    const b = await makeCert('b.test', new Date('2024-01-01Z'), new Date('2030-01-01Z'));
    const rows = await describeCertificates(`${a}\n${b}`);
    expect(rows.filter(([k]) => k.startsWith('Certificate '))).toHaveLength(2);
    const bare = a.split('\n').slice(1, -1).join('');
    expect(get(await describeCertificates(bare), 'Subject')).toContain('a.test');
  });
  it('rejects malformed input with plain messages', async () => {
    await expect(describeCertificates('hello world')).rejects.toThrow(/not a PEM certificate/);
    await expect(describeCertificates('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----')).rejects.toThrow(/No certificate found/);
    await expect(describeCertificates('-----BEGIN CERTIFICATE-----\nAAAAAAAAAAAAAAAAAAAAAAAA\n-----END CERTIFICATE-----')).rejects.toThrow(/could not be parsed/);
  });
  it('derBlocks picks only the wanted labels', () => {
    const pem = '-----BEGIN CERTIFICATE REQUEST-----\nAAAAAAAAAAAAAAAAAAAAAAAA\n-----END CERTIFICATE REQUEST-----';
    expect(derBlocks(pem, ['CERTIFICATE REQUEST'], 'request')).toHaveLength(1);
  });
});
