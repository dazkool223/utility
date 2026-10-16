import { defineTool } from '@/core/types';

export default defineTool({
  id: 'xml-json',
  path: 'formats/xml-json',
  name: 'XML ↔ JSON',
  description: 'Convert XML to JSON and JSON back to XML, with attributes kept as @_ keys',
  category: 'formats',
  audience: 'developer',
  priority: 'P0',
  aliases: ['xml to json', 'json to xml'],
  related: ['xml-format', 'xml-validate', 'json-format', 'yaml-json'],
  inputKind: 'text',
  accepts: ['xml', 'json'],
  example: { input: '<root><item id="1">A</item><item id="2">B</item></root>', expect: '"@_id": 1' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'xml-json:to-json', label: 'XML: to JSON', run: (s: string) => m.xmlToJson(s, { attributes: true, types: true }) },
      { id: 'xml-json:to-xml', label: 'JSON: to XML', run: (s: string) => m.jsonToXml(s) },
    ]),
});
