import { defineTool } from '@/core/types';

export default defineTool({
  id: 'slugify',
  path: 'text/slugify',
  name: 'Slugify',
  description: 'Turn titles and phrases into clean URL slugs, with accents transliterated',
  category: 'text',
  priority: 'P2',
  aliases: ['url slug', 'slug generator', 'permalink', 'seo url', 'kebab slug'],
  related: ['case-convert', 'url-encode'],
  inputKind: 'text',
  example: { input: 'Hello, World! Crème Brûlée', expect: 'hello-world-creme-brulee' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'slugify:slug', label: 'Text: slugify', run: (s: string) => m.slugifyLines(s, m.DEFAULT_SLUG) }]),
});
