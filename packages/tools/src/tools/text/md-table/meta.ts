import { defineTool } from '@/core/types';

export default defineTool({
  id: 'markdown-table',
  path: 'text/markdown-table',
  name: 'Markdown Table Generator',
  description: 'Turn CSV or spreadsheet cells into a Markdown table, or a Markdown table back into CSV',
  category: 'text',
  audience: 'general',
  priority: 'P2',
  aliases: ['csv to markdown', 'tsv to markdown', 'table to markdown', 'markdown table', 'github table', 'excel to markdown'],
  related: ['json-csv', 'markdown-preview'],
  inputKind: 'text',
  accepts: ['csv'],
  example: { input: 'name,age\nAda,36\nLinus,54', expect: '| Linus | 54  |' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'markdown-table:from-csv', label: 'Table: CSV to Markdown', run: (s: string) => m.toMarkdownTable(s, { delimiter: 'auto', align: 'left', pad: true }) },
      { id: 'markdown-table:to-csv', label: 'Table: Markdown to CSV', run: (s: string) => m.markdownTableToCsv(s) },
    ]),
});
