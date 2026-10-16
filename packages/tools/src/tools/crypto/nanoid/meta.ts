import { defineTool } from '@/core/types';

export default defineTool({
  id: 'nanoid-generate',
  path: 'crypto/nanoid',
  name: 'nanoid & Random Token Generator',
  description: 'Generate nanoid, custom-alphabet, hex, Base64 and URL-safe random tokens and API keys',
  category: 'crypto',
  priority: 'P1',
  aliases: ['nanoid', 'random token', 'api key', 'random string', 'secret', 'session id'],
  related: ['uuid-generate', 'ulid', 'password-generate'],
  inputKind: 'none',
  example: { input: '', expect: '' },
  load: () => import('./Tool'),
});
