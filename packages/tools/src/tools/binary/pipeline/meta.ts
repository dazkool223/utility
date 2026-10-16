import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pipeline',
  path: 'binary/pipeline',
  name: 'Pipeline',
  description: 'Chain Tools together, e.g. Base64 decode → gunzip → JSON format, and see every intermediate result',
  category: 'binary',
  priority: 'P1',
  aliases: ['recipe', 'chain', 'cyberchef', 'workflow'],
  inputKind: 'text',
  example: { input: 'eyJhIjoxfQ==', expect: 'eyJhIjoxfQ==' },
  load: () => import('./Tool'),
});
