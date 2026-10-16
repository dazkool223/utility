import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-validate',
  path: 'json/validate',
  name: 'JSON Validator',
  description: 'Check whether JSON is valid and find the exact line and column of any error',
  category: 'json',
  priority: 'P0',
  aliases: ['json lint', 'check json', 'json syntax'],
  related: ['json-format', 'json-repair', 'json-minify'],
  inputKind: 'text',
  accepts: ['json'],
  example: { input: '{"name":"utility","tags":["a","b"]}', expect: 'Valid JSON' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-validate:validate', label: 'JSON: validate report', run: (s: string) => m.validateJson(s) },
    ]),
});
