import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-types',
  path: 'json/types',
  name: 'JSON to Types',
  description: 'Generate TypeScript, Go, Rust, Java, Kotlin, C#, Swift, Zod or Python types from a JSON sample',
  category: 'json',
  audience: 'developer',
  priority: 'P2',
  aliases: ['json to typescript', 'json to go', 'json to struct', 'json to class', 'quicktype', 'json to interface'],
  related: ['json-format'],
  inputKind: 'text',
  accepts: ['json'],
  example: { input: '{"id":1,"name":"Ada","tags":["a","b"]}', expect: 'interface Root' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-types:typescript', label: 'JSON: to TypeScript types', run: (s: string) => m.jsonToTypes(s, 'typescript', 'Root') },
    ]),
});
