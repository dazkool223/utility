import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-minify',
  path: 'json/minify',
  name: 'JSON Minifier',
  description: 'Remove all whitespace from JSON to make it as small as possible',
  category: 'json',
  priority: 'P0',
  aliases: ['compact json', 'compress json', 'json one line'],
  related: ['json-format', 'json-validate', 'json-escape'],
  inputKind: 'text',
  accepts: ['json'],
  example: { input: '{\n  "a": 1,\n  "b": [1, 2]\n}', expect: '{"a":1,"b":[1,2]}' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-minify:minify', label: 'JSON: minify', run: (s: string) => m.minifyJson(s) },
    ]),
});
