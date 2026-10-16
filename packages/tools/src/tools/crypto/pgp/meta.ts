import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pgp',
  path: 'crypto/pgp',
  name: 'PGP Keygen / Encrypt / Sign / Verify',
  description: 'Generate OpenPGP keys, encrypt and decrypt messages, and sign or verify cleartext signatures',
  category: 'crypto',
  priority: 'P2',
  aliases: ['openpgp', 'gpg', 'gnupg', 'pgp encrypt', 'pgp sign', 'pgp key'],
  related: ['rsa-keygen', 'ssh-keygen', 'text-encrypt'],
  inputKind: 'text',
  restrictions: [
    { message: 'This Tool uses OpenPGP.js (LGPL-3.0), loaded as a separate unmodified file. Keys you generate stay in this page: copy or download them before you leave.' },
  ],
  example: { input: 'Alice <alice@example.com>', expect: '-----BEGIN PGP PUBLIC KEY BLOCK-----' },
  load: () => import('./Tool'),
});
