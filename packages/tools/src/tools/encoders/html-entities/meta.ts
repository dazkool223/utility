import { defineTool } from '@/core/types';

export default defineTool({
  id: 'html-entities',
  path: 'encoders/html-entities',
  name: 'HTML Entity Encode / Decode',
  description: 'Escape text as HTML entities (named, hex or decimal) or decode entities back to text',
  category: 'encoders',
  audience: 'developer',
  priority: 'P0',
  aliases: ['html escape', 'html unescape', 'html encode', 'html decode', 'escape html', 'special characters', 'amp lt gt'],
  related: ['url-encode', 'string-escape', 'unicode-escape'],
  inputKind: 'text',
  quickLauncher: true,
  contextMenu: 'Decode HTML entities',
  example: { input: '<p class="x">Tom & Jerry</p>', expect: '&lt;p class=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/p&gt;' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'html-entities:encode', label: 'HTML: escape entities', run: (s: string) => m.encodeEntities(s, 'minimal') },
      { id: 'html-entities:decode', label: 'HTML: decode entities', run: (s: string) => m.decodeEntities(s) },
    ]),
});
