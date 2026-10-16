import { defineTool } from '@/core/types';

export default defineTool({
  id: 'xml-format',
  path: 'formats/xml-format',
  name: 'XML Formatter',
  description: 'Pretty-print XML with your choice of indentation',
  category: 'formats',
  priority: 'P0',
  aliases: ['xml beautify', 'xml prettify', 'xml pretty print', 'format xml'],
  related: ['xml-minify', 'xml-validate', 'xml-json'],
  inputKind: 'text',
  accepts: ['xml'],
  quickLauncher: true,
  contextMenu: 'Format as XML',
  example: { input: '<root><item id="1">A</item><item id="2">B</item></root>', expect: '  <item id="1">A</item>' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'xml-format:pretty', label: 'XML: format (2 spaces)', run: (s: string) => m.formatXml(s, { indent: '2', collapseContent: true }) }]),
});
