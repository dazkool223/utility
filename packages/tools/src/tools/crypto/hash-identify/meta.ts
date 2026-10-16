import { defineTool } from '@/core/types';

export default defineTool({
  id: 'hash-identify',
  path: 'crypto/hash-identify',
  name: 'Hash Type Identifier',
  description: 'Guess which algorithm produced a hash from its length, format and prefix',
  category: 'crypto',
  priority: 'P2',
  aliases: ['identify hash', 'what hash', 'hash detector', 'hashid'],
  related: ['hash-text', 'bcrypt-hash', 'file-checksum'],
  inputKind: 'text',
  restrictions: [{ message: 'A hash cannot be identified with certainty: many algorithms produce the same length. Treat the list as candidates, most likely first.' }],
  example: { input: '5d41402abc4b2a76b9719d911017c592', expect: 'MD5' },
  load: () => import('./Tool'),
});
