import { ToolError } from '@/core/types';
import { algName, colonHex, derBlocks, type Rows } from '../x509/logic';
import { loadX509 } from '../_lib/x509';

export async function describeCsr(input: string): Promise<Rows> {
  const x = await loadX509();
  const [der] = derBlocks(input, ['CERTIFICATE REQUEST', 'NEW CERTIFICATE REQUEST'], 'certificate request');
  let csr: InstanceType<typeof x.Pkcs10CertificateRequest>;
  try {
    csr = new x.Pkcs10CertificateRequest(der as unknown as Uint8Array<ArrayBuffer>);
  } catch {
    throw new ToolError('The data is not a valid PKCS#10 certificate request.');
  }
  const rows: Rows = [];
  rows.push(['Subject', csr.subject || '(empty)']);
  rows.push(['Signature algorithm', algName(csr.signatureAlgorithm as never)]);
  rows.push(['Public key', algName(csr.publicKey.algorithm as never)]);
  let ok = false;
  try {
    ok = await csr.verify();
  } catch {
    ok = false;
  }
  rows.push(['Signature', ok ? 'Valid: the request was signed by the private key matching its public key' : 'Could not be verified']);
  for (const ext of csr.extensions) {
    if (ext instanceof x.SubjectAlternativeNameExtension) rows.push(['Requested alt names', ext.names.items.map((i) => `${i.type}:${i.value}`).join('\n')]);
    else if (ext instanceof x.BasicConstraintsExtension) rows.push(['Basic constraints', `CA: ${ext.ca ? 'yes' : 'no'}`]);
    else rows.push(['Extension', ext.type]);
  }
  rows.push(['SHA-256 of public key', colonHex(await csr.publicKey.getThumbprint('SHA-256'))]);
  return rows;
}
