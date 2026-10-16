import { defineTool } from '@/core/types';

export default defineTool({
  id: 'xml-validate',
  path: 'formats/xml-validate',
  name: 'XML Validator',
  description: 'Check that XML is well-formed and find the line and column of the first error',
  category: 'formats',
  priority: 'P1',
  aliases: ['xml well-formed', 'check xml', 'xml lint', 'xml syntax'],
  related: ['xml-format', 'xml-minify', 'xml-json'],
  inputKind: 'text',
  accepts: ['xml'],
  restrictions: [{ message: 'This checks that XML is well-formed. It does not validate against an XSD or DTD.' }],
  example: { input: '<root><item id="1">A</item><item id="2">B</item></root>', expect: 'Well-formed XML' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'xml-validate:check', label: 'XML: validate', run: (s: string) => m.validateXml(s) }]),
});
