import { defineTool } from '@/core/types';

export default defineTool({
  id: 'xml-minify',
  path: 'formats/xml-minify',
  name: 'XML Minifier',
  description: 'Remove whitespace and optionally comments from XML to make it smaller',
  category: 'formats',
  audience: 'developer',
  priority: 'P1',
  aliases: ['compress xml', 'compact xml', 'xml one line'],
  related: ['xml-format', 'xml-validate'],
  inputKind: 'text',
  accepts: ['xml'],
  example: { input: '<root>\n  <item id="1">A</item>\n  <item id="2">B</item>\n</root>', expect: '<root><item id="1">A</item><item id="2">B</item></root>' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'xml-minify:minify', label: 'XML: minify', run: (s: string) => m.minifyXml(s, true) }]),
});
