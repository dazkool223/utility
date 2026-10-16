import { defineTool } from '@/core/types';

// Example: a self-signed certificate (CN=utility.example) so the generic E2E test has input to decode.
export const EXAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIBZTCCAQugAwIBAgIBATAKBggqhkjOPQQDAjAsMRgwFgYDVQQDEw91dGlsaXR5
LmV4YW1wbGUxEDAOBgNVBAoTB1V0aWxpdHkwHhcNMjUwMTAxMDAwMDAwWhcNMzUw
MTAxMDAwMDAwWjAsMRgwFgYDVQQDEw91dGlsaXR5LmV4YW1wbGUxEDAOBgNVBAoT
B1V0aWxpdHkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARnFZwmLdANgwgDcWah
TjyGVBc1C07kXNIPIxd1pH6XFTjC/Pwu7Roikaw+tn7QOYC6ms8xIdi+YXtC4Y3W
Y4Wbox4wHDAaBgNVHREEEzARgg91dGlsaXR5LmV4YW1wbGUwCgYIKoZIzj0EAwID
SAAwRQIgCOpTOzBaMc+0jMBhXj7vL9dXRELn80vTETbwoZAPqdMCIQDIHzGrPLRu
nwibW1+NYz5sH956enve8XLO/RXu/CV2Bg==
-----END CERTIFICATE-----`;

export default defineTool({
  id: 'x509-decode',
  path: 'crypto/x509',
  name: 'X.509 Certificate Decoder',
  description: 'Decode a PEM certificate: subject, issuer, validity, SANs, key usage and fingerprints',
  category: 'crypto',
  priority: 'P1',
  aliases: ['certificate', 'ssl certificate', 'tls cert', 'pem cert', 'x509', 'cer', 'crt'],
  related: ['csr-decode', 'pem-convert', 'csr-generate'],
  inputKind: 'text',
  accepts: ['pem-cert'],
  restrictions: [{ message: 'Works on pasted PEM only. It cannot fetch a site\'s certificate, and it does not check revocation (OCSP/CRL) or the chain of trust.' }],
  example: { input: EXAMPLE_CERT, expect: 'utility.example' },
  load: () => import('./Tool'),
});
