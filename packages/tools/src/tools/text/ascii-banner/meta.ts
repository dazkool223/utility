import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ascii-banner',
  path: 'text/ascii-banner',
  name: 'ASCII Art Banner',
  description: 'Turn text into large ASCII-art lettering with FIGlet fonts',
  category: 'text',
  priority: 'P2',
  aliases: ['figlet', 'ascii art', 'text art', 'banner', 'big text', 'ascii text'],
  related: ['text-stats', 'case-convert'],
  inputKind: 'text',
  example: { input: 'Hi', expect: '| |_| | |' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'ascii-banner:standard', label: 'Text: ASCII banner (Standard)', run: (s: string) => m.renderBanner(s, 'Standard') }]),
});
