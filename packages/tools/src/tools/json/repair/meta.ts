import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-repair',
  path: 'json/repair',
  name: 'JSON Repair',
  description: 'Fix broken JSON: single quotes, trailing commas, comments, unquoted keys and truncated data',
  category: 'json',
  priority: 'P2',
  aliases: ['fix json', 'json fixer', 'broken json'],
  related: ['json-validate', 'json-format'],
  inputKind: 'text',
  example: { input: "{name: 'utility', tags: ['a', 'b',],}", expect: '"name": "utility"' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-repair:repair', label: 'JSON: repair', run: (s: string) => m.repairJson(s, 2) },
    ]),
});
