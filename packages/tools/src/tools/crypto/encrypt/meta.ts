import { defineTool } from '@/core/types';

export default defineTool({
  id: 'text-encrypt',
  path: 'crypto/encrypt',
  name: 'Text Encrypt / Decrypt',
  description: 'Encrypt text with a passphrase using AES-GCM, AES-CBC or AES-CTR, and decrypt it again',
  category: 'crypto',
  audience: 'general',
  priority: 'P0',
  aliases: ['aes', 'aes-gcm', 'encrypt', 'decrypt', 'cipher', 'pbkdf2'],
  related: ['password-generate', 'hmac-generate', 'hash-text'],
  inputKind: 'text',
  restrictions: [{ message: 'Strong passphrases matter: the key is derived from your passphrase with PBKDF2 (SHA-256), so a short or common passphrase can be guessed offline.' }],
  example: { input: 'Hello, world!', expect: 'utl1.AES-GCM.' },
  load: () => import('./Tool'),
});
