import { defineTool } from '@/core/types';

export default defineTool({
  id: 'unicode-escape',
  path: 'encoders/unicode',
  name: 'Unicode Escape & Code Points',
  description: 'Convert text to \\uXXXX, U+XXXX or HTML escapes and back, and list the code points in a string',
  category: 'encoders',
  priority: 'P1',
  aliases: ['unicode', 'utf-16', 'code points', 'u+', 'unicode to text', 'text to unicode', 'codepoint', 'surrogate pair'],
  related: ['string-escape', 'html-entities', 'text-hex'],
  inputKind: 'text',
  example: { input: 'Aé🙂', expect: '\\u0041\\u00E9\\uD83D\\uDE42' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'unicode-escape:escape', label: 'Unicode: escape as \\uXXXX', run: (s: string) => m.escapeUnicode(s, 'u4', false) },
      { id: 'unicode-escape:unescape', label: 'Unicode: unescape', run: (s: string) => m.unescapeUnicode(s) },
    ]),
});
