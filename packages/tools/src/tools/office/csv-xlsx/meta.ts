import { defineTool } from '@/core/types';

export default defineTool({
  id: 'csv-xlsx',
  path: 'office/csv-xlsx',
  name: 'CSV ↔ XLSX',
  description: 'Turn a CSV file into an Excel workbook, or export a sheet of an .xlsx file to CSV',
  category: 'office',
  priority: 'P2',
  aliases: ['csv to excel', 'excel to csv', 'xlsx to csv', 'csv to xlsx', 'spreadsheet', 'xls'],
  related: ['json-csv'],
  inputKind: 'binary',
  accepts: ['xlsx'],
  restrictions: [
    { message: 'Only .xlsx is supported (not the old .xls format or password-protected files). Formulas export as their last calculated value, and one sheet is exported at a time.' },
  ],
  load: () => import('./Tool'),
});
