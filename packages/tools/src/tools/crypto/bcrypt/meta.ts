import { defineTool } from '@/core/types';

export default defineTool({
  id: 'bcrypt-hash',
  path: 'crypto/bcrypt',
  name: 'Bcrypt Hash / Compare',
  description: 'Hash a password with bcrypt, or check a password against an existing bcrypt hash',
  category: 'crypto',
  priority: 'P1',
  aliases: ['bcrypt', 'password hash', 'blowfish', 'bcrypt verify'],
  related: ['password-generate', 'hash-text', 'password-strength'],
  inputKind: 'text',
  restrictions: [
    { message: 'High cost factors are slow: each +1 doubles the time, and cost 14 or more can take many seconds in the browser.' },
    { message: 'bcrypt only uses the first 72 bytes of a password. Longer passwords are silently cut off by the algorithm.' },
  ],
  example: { input: 'hunter2', expect: '$2' },
  load: () => import('./Tool'),
});
