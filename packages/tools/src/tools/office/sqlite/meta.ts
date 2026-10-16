import { defineTool } from '@/core/types';

export default defineTool({
  id: 'sqlite-browser',
  path: 'office/sqlite',
  name: 'SQLite Database Browser',
  description: 'Open a .sqlite or .db file, browse its tables and run SQL queries',
  category: 'office',
  priority: 'P2',
  aliases: ['sqlite', 'sqlite3', '.db', 'database viewer', 'sql query', 'db browser'],
  related: ['sql-format'],
  inputKind: 'binary',
  accepts: ['sqlite'],
  restrictions: [{ message: 'The whole database is loaded into memory. Changes you make with SQL stay in the browser until you download the modified copy.' }],
  load: () => import('./Tool'),
});
