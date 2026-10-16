import { ToolError } from '@/core/types';
import { base64ToBytes, bytesToHex, parsePem } from '../_lib/bytes';
import { loadX509 } from '../_lib/x509';

export type Rows = Array<[string, string]>;

export function colonHex(buf: ArrayBuffer | Uint8Array): string {
  return bytesToHex(buf instanceof Uint8Array ? buf : new Uint8Array(buf), true, ':');
}

/** Returns DER blobs for every `labels` block in `input`, or a bare Base64 DER body. */
export function derBlocks(input: string, labels: string[], what: string): Uint8Array[] {
  const text = input.trim();
  if (text.includes('-----BEGIN')) {
    const found = parsePem(text).filter((b) => labels.includes(b.label));
    if (!found.length) throw new ToolError(`No ${what} found. Expect a block starting with -----BEGIN ${labels[0]}-----.`);
    return found.map((b) => b.der);
  }
  try {
    const der = base64ToBytes(text);
    if (der.length < 16) throw new Error('short');
    return [der];
  } catch {
    throw new ToolError(`That is not a PEM ${what} or Base64-encoded DER.`);
  }
}

export function algName(a: { name?: string; hash?: { name?: string }; namedCurve?: string; modulusLength?: number }): string {
  const hash = a.hash?.name ? ` with ${a.hash.name}` : '';
  const extra = a.namedCurve ? ` (${a.namedCurve})` : a.modulusLength ? ` (${a.modulusLength} bits)` : '';
  return `${a.name ?? 'unknown'}${hash}${extra}`;
}

export async function describeCertificates(input: string, now = new Date()): Promise<Rows> {
  const x = await loadX509();
  const ders = derBlocks(input, ['CERTIFICATE', 'TRUSTED CERTIFICATE'], 'certificate');
  const rows: Rows = [];
  let n = 0;
  for (const der of ders) {
    n++;
    let cert: InstanceType<typeof x.X509Certificate>;
    try {
      cert = new x.X509Certificate(der as unknown as Uint8Array<ArrayBuffer>);
    } catch {
      throw new ToolError(`Certificate ${n} could not be parsed. The data is not a valid X.509 certificate.`);
    }
    if (ders.length > 1) rows.push([`Certificate ${n}`, '']);
    rows.push(['Subject', cert.subject || '(empty)']);
    rows.push(['Issuer', cert.issuer || '(empty)']);
    rows.push(['Self-signed', cert.subject === cert.issuer ? 'yes (subject equals issuer)' : 'no']);
    rows.push(['Serial number', cert.serialNumber.toUpperCase()]);
    rows.push(['Not before', cert.notBefore.toISOString()]);
    rows.push(['Not after', cert.notAfter.toISOString()]);
    const days = Math.floor((cert.notAfter.getTime() - now.getTime()) / 86_400_000);
    rows.push(['Status', now < cert.notBefore ? 'Not yet valid' : now > cert.notAfter ? `Expired ${-days} days ago` : `Valid, expires in ${days} days`]);
    rows.push(['Signature algorithm', algName(cert.signatureAlgorithm as never)]);
    rows.push(['Public key', algName(cert.publicKey.algorithm as never)]);
    for (const ext of cert.extensions) {
      if (ext instanceof x.SubjectAlternativeNameExtension) rows.push(['Subject alt names', ext.names.items.map((i) => `${i.type}:${i.value}`).join('\n')]);
      else if (ext instanceof x.BasicConstraintsExtension) rows.push(['Basic constraints', `CA: ${ext.ca ? 'yes' : 'no'}${ext.pathLength !== undefined ? `, path length ${ext.pathLength}` : ''}`]);
      else if (ext instanceof x.KeyUsagesExtension) rows.push(['Key usage', keyUsageNames(ext.usages, x.KeyUsageFlags).join(', ')]);
      else if (ext instanceof x.ExtendedKeyUsageExtension) rows.push(['Extended key usage', ext.usages.map((u) => x.OidSerializer.toString(u as string)).join(', ')]);
      else if (ext instanceof x.SubjectKeyIdentifierExtension) rows.push(['Subject key ID', ext.keyId.toUpperCase().replace(/(..)(?!$)/g, '$1:')]);
      else if (ext instanceof x.AuthorityKeyIdentifierExtension && ext.keyId) rows.push(['Authority key ID', ext.keyId.toUpperCase().replace(/(..)(?!$)/g, '$1:')]);
      else if (ext instanceof x.CRLDistributionPointsExtension) rows.push(['CRL distribution points', ext.distributionPoints.length + ' point(s)']);
      else if (ext instanceof x.AuthorityInfoAccessExtension) rows.push(['Authority info access', [...ext.ocsp, ...ext.caIssuers].map((g) => g.value).join('\n')]);
    }
    const sha1 = await cert.getThumbprint('SHA-1');
    const sha256 = await cert.getThumbprint('SHA-256');
    rows.push(['SHA-1 fingerprint', colonHex(sha1)]);
    rows.push(['SHA-256 fingerprint', colonHex(sha256)]);
  }
  return rows;
}

function keyUsageNames(flags: number, K: Record<string, number | string>): string[] {
  const out: string[] = [];
  for (const [name, bit] of Object.entries(K)) if (typeof bit === 'number' && bit && (flags & bit) === bit) out.push(name);
  return out;
}
