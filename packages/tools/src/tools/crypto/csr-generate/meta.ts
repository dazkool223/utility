import { defineTool } from '@/core/types';

export default defineTool({
  id: 'csr-generate',
  path: 'crypto/csr-generate',
  name: 'CSR / Self-Signed Certificate Generator',
  description: 'Create a certificate signing request or a self-signed certificate plus its private key',
  category: 'crypto',
  priority: 'P2',
  aliases: ['openssl req', 'self signed certificate', 'generate csr', 'ssl certificate', 'localhost certificate'],
  related: ['csr-decode', 'x509-decode', 'rsa-keygen', 'pem-convert'],
  inputKind: 'none',
  restrictions: [{ message: 'Self-signed certificates are not trusted by browsers or other clients unless you add them to their trust store. Use them for development and testing.' }],
  example: { input: '', expect: '-----BEGIN CERTIFICATE REQUEST-----' },
  load: () => import('./Tool'),
});
