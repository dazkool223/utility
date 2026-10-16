import { defineTool } from '@/core/types';

export default defineTool({
  id: 'case-convert',
  path: 'text/case',
  name: 'Case Converter',
  description: 'Convert text to camelCase, snake_case, kebab-case, Title Case and more, or see every case at once',
  category: 'text',
  priority: 'P0',
  aliases: ['camelcase', 'snake case', 'kebab case', 'uppercase', 'lowercase', 'title case', 'pascal case', 'constant case', 'sentence case'],
  related: ['slugify', 'line-tools'],
  inputKind: 'text',
  quickLauncher: true,
  example: { input: 'hello world foo', expect: 'helloWorldFoo' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) =>
      (['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'sentence', 'upper', 'lower'] as const).map((id) => ({
        id: `case:${id}`,
        label: `Case: ${m.CASES.find((c) => c.id === id)!.label}`,
        run: (s: string) => m.convertCase(s, id),
      })),
    ),
});
