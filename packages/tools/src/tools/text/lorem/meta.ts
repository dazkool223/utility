import { defineTool } from '@/core/types';

export default defineTool({
  id: 'lorem-ipsum',
  path: 'text/lorem',
  name: 'Lorem Ipsum Generator',
  description: 'Generate placeholder paragraphs, sentences or words, optionally wrapped in HTML',
  category: 'text',
  audience: 'general',
  priority: 'P0',
  aliases: ['placeholder text', 'dummy text', 'filler text', 'lipsum', 'random text'],
  related: ['fake-data', 'text-stats'],
  inputKind: 'none',
  quickLauncher: true,
  example: { input: '', expect: 'Lorem ipsum dolor sit amet' },
  load: () => import('./Tool'),
});
