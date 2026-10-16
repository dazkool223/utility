import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ssh-keygen',
  path: 'crypto/ssh-keygen',
  name: 'SSH Key Generator / Fingerprint',
  description: 'Generate Ed25519 or RSA SSH keys in OpenSSH format, or compute the fingerprint of a public key',
  category: 'crypto',
  audience: 'developer',
  priority: 'P2',
  aliases: ['ssh', 'ssh-keygen', 'openssh', 'ed25519', 'authorized_keys', 'ssh fingerprint', 'id_rsa'],
  related: ['rsa-keygen', 'pem-convert', 'pgp'],
  inputKind: 'text',
  restrictions: [
    { message: 'Generated private keys have no passphrase. Add one on your machine with "ssh-keygen -p -f <file>" before using the key.' },
    { message: 'Ed25519 key generation needs a recent browser. If yours lacks it, use RSA.' },
  ],
  example: {
    input: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl',
    expect: 'SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU',
  },
  load: () => import('./Tool'),
});
