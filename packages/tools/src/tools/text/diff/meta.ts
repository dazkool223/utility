import { defineTool } from '@/core/types';

export default defineTool({
  id: 'text-diff',
  path: 'text/diff',
  name: 'Text Diff',
  description: 'Compare two texts and highlight what was added, removed or changed, line by line, word by word or by character',
  category: 'text',
  priority: 'P0',
  aliases: ['compare text', 'diff checker', 'text compare', 'find differences', 'file compare', 'unified diff', 'patch'],
  related: ['json-diff', 'list-compare'],
  inputKind: 'text',
  example: { input: 'first line\nsecond line', expect: 'second line' },
  load: () => import('./Tool'),
});
