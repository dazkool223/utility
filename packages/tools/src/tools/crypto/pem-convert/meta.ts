import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pem-convert',
  path: 'crypto/pem-convert',
  name: 'PEM / DER / JWK Converter',
  description: 'Convert keys and certificates between PEM, DER (hex or Base64) and JSON Web Key',
  category: 'crypto',
  priority: 'P2',
  aliases: ['pem to der', 'der to pem', 'jwk to pem', 'pem to jwk', 'pkcs1 to pkcs8', 'key converter'],
  related: ['rsa-keygen', 'x509-decode', 'csr-decode', 'ssh-keygen'],
  inputKind: 'text',
  accepts: ['pem-key', 'pem-cert', 'pem-csr'],
  example: {
    input: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEZxWcJi3QDYMIA3FmoU48hlQXNQtO5FzSDyMXdaR+lxU4wvz8Lu0aIpGsPrZ+0DmAuprPMSHYvmF7QuGN1mOFmw==\n-----END PUBLIC KEY-----',
    expect: '"crv": "P-256"',
  },
  load: () => import('./Tool'),
});
