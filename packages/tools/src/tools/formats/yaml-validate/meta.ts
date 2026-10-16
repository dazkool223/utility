import { defineTool } from '@/core/types';

export default defineTool({
  id: 'yaml-validate',
  path: 'formats/yaml-validate',
  name: 'YAML Validator',
  description: 'Lint YAML and find syntax errors, duplicate keys and bad indentation with line and column',
  category: 'formats',
  priority: 'P1',
  aliases: ['yaml lint', 'yaml linter', 'check yaml', 'yml validator'],
  related: ['yaml-format', 'yaml-json'],
  inputKind: 'text',
  accepts: ['yaml'],
  example: { input: 'name: utility\ntags:\n  - a\n  - b\n', expect: 'Valid YAML' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'yaml-validate:check', label: 'YAML: validate', run: (s: string) => m.validateYaml(s) }]),
});
