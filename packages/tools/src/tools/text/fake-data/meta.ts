import { defineTool } from '@/core/types';

export default defineTool({
  id: 'fake-data',
  path: 'text/fake-data',
  name: 'Fake Data Generator',
  description: 'Generate realistic fake names, emails, addresses, companies and more as JSON, CSV or lines',
  category: 'text',
  audience: 'developer',
  priority: 'P2',
  aliases: ['mock data', 'faker', 'dummy data', 'test data', 'random name', 'random email', 'sample data', 'random address'],
  related: ['lorem-ipsum', 'json-csv'],
  inputKind: 'none',
  example: { input: '', expect: '"email"' },
  load: () => import('./Tool'),
});
