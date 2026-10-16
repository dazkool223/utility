import { defineTool } from '@/core/types';

export default defineTool({
  id: 'list-compare',
  path: 'text/list-compare',
  name: 'List Comparer',
  description: 'Compare two lists and get the union, intersection, or the items only in one of them',
  category: 'text',
  audience: 'general',
  priority: 'P1',
  aliases: ['set operations', 'compare lists', 'intersection', 'union', 'difference', 'common lines', 'unique to list'],
  related: ['line-tools', 'text-diff'],
  inputKind: 'text',
  example: { input: 'apple\nbanana\ncherry', expect: 'apple' },
  load: () => import('./Tool'),
});
