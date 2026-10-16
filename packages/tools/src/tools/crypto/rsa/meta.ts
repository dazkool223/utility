import { defineTool } from '@/core/types';

export default defineTool({
  id: 'rsa-keygen',
  path: 'crypto/rsa',
  name: 'RSA Key Pair Generator',
  description: 'Generate RSA 2048, 3072 or 4096-bit key pairs as PEM (PKCS#8 / SPKI) or JWK',
  category: 'crypto',
  audience: 'developer',
  priority: 'P1',
  aliases: ['rsa', 'keypair', 'private key', 'public key', 'pkcs8', 'spki', 'jwk'],
  related: ['pem-convert', 'x509-decode', 'ssh-keygen', 'csr-generate'],
  inputKind: 'none',
  restrictions: [{ message: 'Generating a 4096-bit key can take several seconds. Keys are made locally and never leave this page.' }],
  example: { input: '', expect: '-----BEGIN PRIVATE KEY-----' },
  load: () => import('./Tool'),
});
