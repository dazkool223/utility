import { defineTool } from '@/core/types';

export default defineTool({
  id: 'sql-format',
  path: 'code/sql-format',
  name: 'SQL Formatter',
  description: 'Pretty-print SQL for PostgreSQL, MySQL, SQLite, SQL Server, Oracle and more',
  category: 'code',
  priority: 'P0',
  aliases: ['sql beautifier', 'sql prettify', 'format sql', 'sql pretty print', 'beautify sql', 'sql lint'],
  related: ['json-sql', 'js-format', 'css-format', 'json-format'],
  inputKind: 'text',
  accepts: ['sql'],
  example: { input: "select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=1 group by u.id,u.name order by orders desc", expect: 'LEFT JOIN' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'sql-format:pretty', label: 'SQL: format (2 spaces, upper-case keywords)', run: (s: string) => m.formatSql(s) },
      { id: 'sql-format:lower', label: 'SQL: format (2 spaces, lower-case keywords)', run: (s: string) => m.formatSql(s, { ...m.DEFAULT_SQL_OPTIONS, keywordCase: 'lower' }) },
    ]),
});
