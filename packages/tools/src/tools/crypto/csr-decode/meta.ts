import { defineTool } from '@/core/types';

const EXAMPLE_CSR = `-----BEGIN CERTIFICATE REQUEST-----
MIIBKjCB0AIBADAsMRgwFgYDVQQDEw91dGlsaXR5LmV4YW1wbGUxEDAOBgNVBAoT
B1V0aWxpdHkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARnFZwmLdANgwgDcWah
TjyGVBc1C07kXNIPIxd1pH6XFTjC/Pwu7Roikaw+tn7QOYC6ms8xIdi+YXtC4Y3W
Y4WboEIwQAYJKoZIhvcNAQkOMTMwMTAvBgNVHREEKDAmgg91dGlsaXR5LmV4YW1w
bGWCE3d3dy51dGlsaXR5LmV4YW1wbGUwCgYIKoZIzj0EAwIDSQAwRgIhAMLl2WM4
fV90vPZokJ/02IRQiFSc1+2rW9ceRpfuIFMyAiEA8Bk9x4PmrhlBDlcol/o1+sdK
TLSycNSKofF3evGNF0I=
-----END CERTIFICATE REQUEST-----`;

export default defineTool({
  id: 'csr-decode',
  path: 'crypto/csr-decode',
  name: 'CSR Decoder',
  description: 'Decode a PEM certificate signing request: subject, public key, requested SANs and signature check',
  category: 'crypto',
  priority: 'P2',
  aliases: ['csr', 'certificate request', 'pkcs10', 'certificate signing request'],
  related: ['csr-generate', 'x509-decode', 'pem-convert'],
  inputKind: 'text',
  accepts: ['pem-csr'],
  example: { input: EXAMPLE_CSR, expect: 'utility.example' },
  load: () => import('./Tool'),
});
