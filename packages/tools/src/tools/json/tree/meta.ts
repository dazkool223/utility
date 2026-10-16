import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-tree',
  path: 'json/tree',
  name: 'JSON Tree Viewer',
  description: 'Explore JSON as a collapsible tree and copy the path of any value',
  category: 'json',
  priority: 'P1',
  aliases: ['json viewer', 'json explorer', 'json path copy', 'json outline'],
  related: ['json-format'],
  inputKind: 'text',
  accepts: ['json'],
  example: { input: '{"user":{"name":"Ada","langs":["js","ts"]}}', expect: 'langs' },
  load: () => import('./Tool'),
});
