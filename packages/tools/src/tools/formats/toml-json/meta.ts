import { defineTool } from '@/core/types';

export default defineTool({
  id: 'toml-json',
  path: 'formats/toml-json',
  name: 'TOML ↔ JSON',
  description: 'Convert TOML to JSON and JSON to TOML',
  category: 'formats',
  audience: 'developer',
  priority: 'P1',
  aliases: ['toml to json', 'json to toml', 'cargo toml', 'pyproject'],
  related: ['toml-yaml', 'json-format', 'yaml-json'],
  inputKind: 'text',
  example: { input: 'title = "utility"\n\n[owner]\nname = "Ada"\n', expect: '"title": "utility"' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'toml-json:to-json', label: 'TOML: to JSON', run: (s: string) => m.tomlToJson(s) },
      { id: 'toml-json:to-toml', label: 'JSON: to TOML', run: (s: string) => m.jsonToToml(s) },
    ]),
});
