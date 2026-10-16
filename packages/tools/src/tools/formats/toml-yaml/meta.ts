import { defineTool } from '@/core/types';

export default defineTool({
  id: 'toml-yaml',
  path: 'formats/toml-yaml',
  name: 'TOML ↔ YAML',
  description: 'Convert TOML to YAML and YAML to TOML',
  category: 'formats',
  audience: 'developer',
  priority: 'P1',
  aliases: ['toml to yaml', 'yaml to toml'],
  related: ['toml-json', 'yaml-json'],
  inputKind: 'text',
  example: { input: 'title = "utility"\n\n[owner]\nname = "Ada"\n', expect: 'name: Ada' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'toml-yaml:to-yaml', label: 'TOML: to YAML', run: (s: string) => m.tomlToYaml(s) },
      { id: 'toml-yaml:to-toml', label: 'YAML: to TOML', run: (s: string) => m.yamlToToml(s) },
    ]),
});
