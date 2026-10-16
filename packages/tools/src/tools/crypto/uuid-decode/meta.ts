import { defineTool } from '@/core/types';

export default defineTool({
  id: 'uuid-decode',
  path: 'crypto/uuid-decode',
  name: 'UUID Decoder',
  description: 'Show the version, variant, embedded timestamp and node of a UUID',
  category: 'crypto',
  priority: 'P2',
  aliases: ['guid decode', 'uuid parser', 'uuid version', 'uuid timestamp', 'uuid inspector'],
  related: ['uuid-generate', 'ulid'],
  inputKind: 'text',
  accepts: ['uuid'],
  example: { input: '017F22E2-79B0-7CC3-98C4-DC0C0C07398F', expect: '2022-02-22T19:22:22.000Z' },
  load: () => import('./Tool'),
});
