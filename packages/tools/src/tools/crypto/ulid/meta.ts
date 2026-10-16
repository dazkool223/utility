import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ulid',
  path: 'crypto/ulid',
  name: 'ULID Generator / Decoder',
  description: 'Generate sortable ULIDs, or decode one to see its timestamp and random part',
  category: 'crypto',
  audience: 'developer',
  priority: 'P1',
  aliases: ['ulid', 'sortable id', 'lexicographic id'],
  related: ['uuid-generate', 'uuid-decode', 'nanoid-generate'],
  inputKind: 'text',
  example: { input: '01ARZ3NDEKTSV4RRFFQ69G5FAV', expect: '2016-07-30T23:54:10.259Z' },
  load: () => import('./Tool'),
});
