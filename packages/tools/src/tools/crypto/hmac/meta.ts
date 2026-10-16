import { defineTool } from '@/core/types';

export default defineTool({
  id: 'hmac-generate',
  path: 'crypto/hmac',
  name: 'HMAC Generator',
  description: 'Compute HMAC-SHA-256, SHA-512, SHA-1, MD5 and more from a message and a secret key',
  category: 'crypto',
  audience: 'developer',
  priority: 'P1',
  aliases: ['hmac-sha256', 'hmac sha1', 'keyed hash', 'message authentication', 'webhook signature'],
  related: ['hash-text', 'text-encrypt'],
  inputKind: 'text',
  example: { input: 'what do ya want for nothing?', expect: '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843' },
  load: () => import('./Tool'),
});
