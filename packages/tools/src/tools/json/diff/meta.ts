import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-diff',
  path: 'json/diff',
  name: 'JSON Diff',
  description: 'Compare two JSON documents and list every added, removed and changed value by path',
  category: 'json',
  audience: 'developer',
  priority: 'P1',
  aliases: ['compare json', 'json compare', 'json difference'],
  related: ['json-format'],
  inputKind: 'text',
  example: { input: '{"name":"utility","version":1}', expect: '- $: {"name"' },
  load: () => import('./Tool'),
});
