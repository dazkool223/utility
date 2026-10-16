import { defineTool } from '@/core/types';

export default defineTool({
  id: 'string-escape',
  path: 'encoders/string-escape',
  name: 'String Escape / Unescape',
  description: 'Escape or unescape text for JavaScript, JSON, Java, C#, SQL, XML and CSV',
  category: 'encoders',
  audience: 'developer',
  priority: 'P0',
  aliases: ['escape string', 'unescape string', 'backslash escape', 'add slashes', 'escape quotes', 'sql escape', 'xml escape'],
  related: ['json-escape', 'html-entities', 'url-encode', 'unicode-escape'],
  inputKind: 'text',
  example: { input: 'say "hi"\ndone', expect: 'say \\"hi\\"\\ndone' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'string-escape:js-escape', label: 'String: escape for JavaScript', run: (s: string) => m.escapeString(s, 'js') },
      { id: 'string-escape:js-unescape', label: 'String: unescape JavaScript', run: (s: string) => m.unescapeString(s, 'js') },
      { id: 'string-escape:sql-escape', label: 'String: escape for SQL', run: (s: string) => m.escapeString(s, 'sql') },
    ]),
});
