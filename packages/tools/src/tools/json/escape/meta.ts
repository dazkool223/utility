import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-escape',
  path: 'json/escape',
  name: 'JSON Escape / Stringify',
  description: 'Turn text or JSON into an escaped JSON string, or unescape a JSON string back',
  category: 'json',
  priority: 'P1',
  aliases: ['stringify', 'json stringify', 'unescape json', 'escape json', 'json string'],
  related: ['json-format', 'json-minify'],
  inputKind: 'text',
  example: { input: '{"a": 1}', expect: '"{' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-escape:escape', label: 'JSON: escape as string', run: (s: string) => m.stringifyText(s, false) },
      { id: 'json-escape:unescape', label: 'JSON: unescape string', run: (s: string) => m.unstringifyText(s) },
    ]),
});
