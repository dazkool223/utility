import { describe, expect, it } from 'vitest';
import meta from './meta';
import { describeCsr } from './logic';

const get = (rows: Array<[string, string]>, k: string) => rows.find(([key]) => key === k)?.[1];

describe('describeCsr', () => {
  it('decodes the sample CSR', async () => {
    const rows = await describeCsr(meta.example!.input);
    expect(get(rows, 'Subject')).toContain('CN=utility.example');
    expect(get(rows, 'Signature algorithm')).toContain('ECDSA');
    expect(get(rows, 'Public key')).toContain('P-256');
    expect(get(rows, 'Signature')).toMatch(/^Valid/);
    expect(get(rows, 'Requested alt names')).toBe('dns:utility.example\ndns:www.utility.example');
  });
  it('flags a tampered signature', async () => {
    const pem = meta.example!.input;
    const lines = pem.split('\n');
    const i = lines.length - 3;
    lines[i] = lines[i]!.replace(/[A-Za-z]/, (c) => (c === 'A' ? 'B' : 'A'));
    const rows = await describeCsr(lines.join('\n'));
    expect(get(rows, 'Signature')).toBe('Could not be verified');
  });
  it('rejects malformed input', async () => {
    await expect(describeCsr('nope')).rejects.toThrow(/not a PEM/);
    await expect(describeCsr('-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----')).rejects.toThrow(/No certificate request/);
    await expect(describeCsr('-----BEGIN CERTIFICATE REQUEST-----\nAAAAAAAAAAAAAAAAAAAAAAAA\n-----END CERTIFICATE REQUEST-----')).rejects.toThrow(/not a valid/);
  });
});
