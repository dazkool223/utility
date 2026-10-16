import { defineTool } from '@/core/types';

export default defineTool({
  id: 'yaml-format',
  path: 'formats/yaml-format',
  name: 'YAML Formatter',
  description: 'Clean up YAML indentation, optionally sort keys, and keep your comments',
  category: 'formats',
  audience: 'developer',
  priority: 'P1',
  aliases: ['yaml beautify', 'yaml prettify', 'yml formatter', 'format yaml'],
  related: ['yaml-validate', 'yaml-json'],
  inputKind: 'text',
  accepts: ['yaml'],
  example: { input: 'a:\n      b: 1\n      c:\n          - x', expect: '  b: 1' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'yaml-format:format', label: 'YAML: format (2 spaces)', run: (s: string) => m.formatYaml(s, { indent: 2, sortKeys: false }) },
      { id: 'yaml-format:sorted', label: 'YAML: format, sort keys', run: (s: string) => m.formatYaml(s, { indent: 2, sortKeys: true }) },
    ]),
});
