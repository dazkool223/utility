import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-csv',
  path: 'json/csv',
  name: 'JSON ↔ CSV',
  description: 'Convert JSON arrays to CSV and CSV back to JSON, with nested objects flattened',
  category: 'json',
  audience: 'general',
  priority: 'P0',
  aliases: ['csv to json', 'json to csv', 'tsv'],
  related: ['json-format', 'json-sql'],
  inputKind: 'text',
  accepts: ['csv', 'json'],
  example: { input: '[{"id":1,"name":"Ada"},{"id":2,"name":"Linus"}]', expect: 'id,name' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-csv:to-csv', label: 'JSON: to CSV', run: (s: string) => m.jsonToCsv(s, ',') },
      { id: 'json-csv:to-json', label: 'CSV: to JSON', run: (s: string) => m.csvToJson(s, 'auto', { types: true, unflatten: false }) },
    ]),
});
