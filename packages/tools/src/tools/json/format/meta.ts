import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-format',
  path: 'json/format',
  name: 'JSON Formatter',
  description: 'Pretty-print and validate JSON with your choice of indentation',
  category: 'json',
  priority: 'P0',
  aliases: ['beautify', 'prettify', 'pretty print', 'json lint'],
  related: ['json-validate', 'json-minify', 'json-csv', 'json-tree', 'json-diff', 'json-path', 'json-repair', 'json-escape', 'json-types', 'json-sql'],
  inputKind: 'text',
  accepts: ['json'],
  quickLauncher: true,
  contextMenu: 'Format as JSON',
  example: { input: '{"name":"utility","tags":["json","yaml"],"ok":true}', expect: '"name": "utility"' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-format:pretty', label: 'JSON: format (2 spaces)', run: (s: string) => m.formatJson(s, { indent: '2', sortKeys: false }) },
      { id: 'json-format:sorted', label: 'JSON: format, sort keys', run: (s: string) => m.formatJson(s, { indent: '2', sortKeys: true }) },
    ]),
});
