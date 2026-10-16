import { ToolError } from '@/core/types';
import { bytesToHex, randomBytes, toPem } from '../_lib/bytes';
import { loadX509 } from '../_lib/x509';

export type KeyType = 'ec-p256' | 'ec-p384' | 'rsa-2048' | 'rsa-3072';

export interface CsrOptions {
  mode: 'csr' | 'self-signed';
  keyType: KeyType;
  commonName: string;
  organization?: string;
  unit?: string;
  country?: string;
  state?: string;
  locality?: string;
  /** One per line or comma separated: DNS names, IPs, e-mail addresses, URLs. */
  altNames?: string;
  days?: number;
}

export interface CsrResult {
  privateKeyPem: string;
  /** PEM of the CSR or the certificate. */
  outputPem: string;
}

export function parseAltNames(text: string): Array<{ type: 'dns' | 'ip' | 'email' | 'url'; value: string }> {
  const out: Array<{ type: 'dns' | 'ip' | 'email' | 'url'; value: string }> = [];
  for (const raw of text.split(/[\n,]/)) {
    const v = raw.trim();
    if (!v) continue;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v) && v.split('.').every((p) => Number(p) <= 255)) out.push({ type: 'ip', value: v });
    else if (/^[0-9a-f:]+$/i.test(v) && v.includes(':')) out.push({ type: 'ip', value: v });
    else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) out.push({ type: 'url', value: v });
    else if (v.includes('@')) out.push({ type: 'email', value: v });
    else if (/^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(v)) out.push({ type: 'dns', value: v });
    else throw new ToolError(`"${v}" is not a valid DNS name, IP address, e-mail or URL.`);
  }
  return out;
}

function algs(k: KeyType): { gen: EcKeyGenParams | RsaHashedKeyGenParams; sign: EcdsaParams | RsaHashedImportParams | { name: string; namedCurve?: string; hash: string } } {
  switch (k) {
    case 'ec-p256': return { gen: { name: 'ECDSA', namedCurve: 'P-256' }, sign: { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' } };
    case 'ec-p384': return { gen: { name: 'ECDSA', namedCurve: 'P-384' }, sign: { name: 'ECDSA', namedCurve: 'P-384', hash: 'SHA-384' } };
    default: {
      const bits = k === 'rsa-2048' ? 2048 : 3072;
      return {
        gen: { name: 'RSASSA-PKCS1-v1_5', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        sign: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      };
    }
  }
}

export async function generateCsrOrCert(o: CsrOptions, now = new Date()): Promise<CsrResult> {
  const cn = o.commonName.trim();
  if (!cn) throw new ToolError('Enter a common name (for example the domain, www.example.com).');
  const country = (o.country ?? '').trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) throw new ToolError('The country must be a two-letter code such as US or DE.');
  const days = o.days ?? 365;
  if (o.mode === 'self-signed' && !(Number.isInteger(days) && days >= 1 && days <= 36500)) throw new ToolError('Validity must be a whole number of days from 1 to 36500.');
  const sans = parseAltNames(o.altNames ?? '');
  if (!sans.length && o.mode === 'self-signed' && /^(\*\.)?[a-z0-9.-]+$/i.test(cn)) sans.push({ type: 'dns', value: cn });

  const x = await loadX509();
  const { gen, sign } = algs(o.keyType);
  const keys = (await crypto.subtle.generateKey(gen, true, ['sign', 'verify'])) as CryptoKeyPair;
  const name = [
    country && { C: [country] },
    o.state?.trim() && { ST: [o.state.trim()] },
    o.locality?.trim() && { L: [o.locality.trim()] },
    o.organization?.trim() && { O: [o.organization.trim()] },
    o.unit?.trim() && { OU: [o.unit.trim()] },
    { CN: [cn] },
  ].filter(Boolean) as unknown as Array<Record<string, string[]>>;
  const san = sans.length ? [new x.SubjectAlternativeNameExtension(sans as never)] : [];
  const privateKeyPem = toPem('PRIVATE KEY', new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey)));
  if (o.mode === 'csr') {
    const csr = await x.Pkcs10CertificateRequestGenerator.create({ name, keys, signingAlgorithm: sign, extensions: san });
    return { privateKeyPem, outputPem: toPem('CERTIFICATE REQUEST', new Uint8Array(csr.rawData)) };
  }
  const serial = randomBytes(16);
  serial[0] = serial[0]! & 0x7f;
  const notAfter = new Date(now.getTime() + days * 86_400_000);
  const cert = await x.X509CertificateGenerator.createSelfSigned({
    serialNumber: bytesToHex(serial),
    name,
    notBefore: new Date(now.getTime() - 60_000),
    notAfter,
    keys,
    signingAlgorithm: sign,
    extensions: [
      new x.BasicConstraintsExtension(false, undefined, true),
      new x.KeyUsagesExtension(x.KeyUsageFlags.digitalSignature | x.KeyUsageFlags.keyEncipherment, true),
      new x.ExtendedKeyUsageExtension([x.ExtendedKeyUsage.serverAuth, x.ExtendedKeyUsage.clientAuth]),
      await x.SubjectKeyIdentifierExtension.create(keys.publicKey),
      ...san,
    ],
  });
  return { privateKeyPem, outputPem: toPem('CERTIFICATE', new Uint8Array(cert.rawData)) };
}
