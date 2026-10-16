import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-path',
  path: 'json/path',
  name: 'JSONPath Tester',
  description: 'Run JSONPath expressions against JSON and see every match',
  category: 'json',
  audience: 'developer',
  priority: 'P1',
  aliases: ['jsonpath', 'json query', 'jpath', 'json select'],
  related: ['json-format', 'json-tree'],
  inputKind: 'text',
  example: { input: '{"store":{"book":[{"title":"A","price":8},{"title":"B","price":12}]}}', expect: '"A"' },
  load: () => import('./Tool'),
});
