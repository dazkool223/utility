import { describe, expect, it } from 'vitest';
import { describeCertificates } from '../x509/logic';
import { describeCsr } from '../csr-decode/logic';
import { generateCsrOrCert, parseAltNames } from './logic';

const get = (rows: Array<[string, string]>, k: string) => rows.find(([key]) => key === k)?.[1];

describe('generateCsrOrCert', () => {
  it('creates a CSR that decodes with a valid signature and SANs', async () => {
    const r = await generateCsrOrCert({
      mode: 'csr',
      keyType: 'ec-p256',
      commonName: 'www.example.com',
      organization: 'Example, Inc.',
      country: 'us',
      altNames: 'example.com\nwww.example.com, 10.0.0.1',
    });
    expect(r.outputPem).toMatch(/^-----BEGIN CERTIFICATE REQUEST-----/);
    expect(r.privateKeyPem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    const rows = await describeCsr(r.outputPem);
    expect(get(rows, 'Subject')).toContain('CN=www.example.com');
    expect(get(rows, 'Subject')).toContain('Example\\, Inc.');
    expect(get(rows, 'Signature')).toMatch(/^Valid/);
    expect(get(rows, 'Requested alt names')).toBe('dns:example.com\ndns:www.example.com\nip:10.0.0.1');
  });
  it('creates a self-signed certificate with the requested validity', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const r = await generateCsrOrCert({ mode: 'self-signed', keyType: 'ec-p384', commonName: 'dev.local', days: 30 }, now);
    const rows = await describeCertificates(r.outputPem, now);
    expect(get(rows, 'Self-signed')).toMatch(/^yes/);
    expect(get(rows, 'Status')).toMatch(/^Valid, expires in 29 days|^Valid, expires in 30 days/);
    expect(get(rows, 'Subject alt names')).toBe('dns:dev.local');
    expect(get(rows, 'Public key')).toContain('P-384');
    expect(get(rows, 'Basic constraints')).toBe('CA: no');
  });
  it('supports RSA keys', async () => {
    const r = await generateCsrOrCert({ mode: 'csr', keyType: 'rsa-2048', commonName: 'rsa.test' });
    expect(get(await describeCsr(r.outputPem), 'Public key')).toContain('2048');
  });
  it('rejects bad input', async () => {
    await expect(generateCsrOrCert({ mode: 'csr', keyType: 'ec-p256', commonName: ' ' })).rejects.toThrow(/common name/);
    await expect(generateCsrOrCert({ mode: 'csr', keyType: 'ec-p256', commonName: 'a', country: 'USA' })).rejects.toThrow(/two-letter/);
    await expect(generateCsrOrCert({ mode: 'self-signed', keyType: 'ec-p256', commonName: 'a', days: 0 })).rejects.toThrow(/Validity/);
    await expect(generateCsrOrCert({ mode: 'csr', keyType: 'ec-p256', commonName: 'a', altNames: 'bad name!' })).rejects.toThrow(/not a valid/);
  });
});

describe('parseAltNames', () => {
  it('classifies names', () => {
    expect(parseAltNames('a.com, 1.2.3.4\n::1\nme@x.org\nhttps://x.org/p')).toEqual([
      { type: 'dns', value: 'a.com' },
      { type: 'ip', value: '1.2.3.4' },
      { type: 'ip', value: '::1' },
      { type: 'email', value: 'me@x.org' },
      { type: 'url', value: 'https://x.org/p' },
    ]);
    expect(parseAltNames('')).toEqual([]);
    expect(parseAltNames('*.example.com')).toEqual([{ type: 'dns', value: '*.example.com' }]);
  });
});
