import { defineTool } from '@/core/types';

export default defineTool({
  id: 'uuid-generate',
  path: 'crypto/uuid',
  name: 'UUID Generator',
  description: 'Generate UUID v4, v7 or v1 identifiers, one or thousands at a time',
  category: 'crypto',
  priority: 'P0',
  aliases: ['guid', 'uuid4', 'uuid7', 'random id'],
  inputKind: 'none',
  quickLauncher: true,
  example: { input: '', expect: '-4' },
  load: () => import('./Tool'),
});
