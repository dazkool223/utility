import { defineTool } from '@/core/types';

export default defineTool({
  id: 'json-sql',
  path: 'json/sql',
  name: 'JSON to SQL',
  description: 'Generate CREATE TABLE and INSERT statements from a JSON array of objects',
  category: 'json',
  audience: 'developer',
  priority: 'P1',
  aliases: ['json to insert', 'json to create table', 'json to mysql', 'json to postgres'],
  related: ['json-csv', 'json-format'],
  inputKind: 'text',
  example: { input: '[{"id":1,"name":"Ada"},{"id":2,"name":"O\'Brien"}]', expect: 'INSERT INTO' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'json-sql:postgres', label: 'JSON: to SQL INSERT (PostgreSQL)', run: (s: string) => m.jsonToSql(s, { table: 'my_table', dialect: 'postgres', createTable: true }) },
    ]),
});
