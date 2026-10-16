import { defineTool } from '@/core/types';

export default defineTool({
  id: 'yaml-json',
  path: 'formats/yaml-json',
  name: 'JSON ↔ YAML',
  description: 'Convert JSON to YAML and YAML to JSON, including multi-document YAML',
  category: 'formats',
  priority: 'P0',
  aliases: ['yaml to json', 'json to yaml', 'yml'],
  related: ['json-format', 'toml-yaml', 'yaml-validate', 'yaml-format'],
  inputKind: 'text',
  accepts: ['yaml', 'json'],
  example: { input: '{"name":"utility","tags":["a","b"],"nested":{"ok":true}}', expect: 'name: utility' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'yaml-json:to-yaml', label: 'JSON: to YAML', run: (s: string) => m.jsonToYaml(s) },
      { id: 'yaml-json:to-json', label: 'YAML: to JSON', run: (s: string) => m.yamlToJson(s) },
    ]),
});
