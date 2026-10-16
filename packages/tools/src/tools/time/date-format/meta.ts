import { defineTool } from '@/core/types';

export default defineTool({
  id: 'date-format',
  path: 'time/date-format',
  name: 'Date Parser & Formatter',
  description: 'Read a date in almost any format and see it as ISO 8601, RFC 2822, SQL, US/EU styles, Unix time and a custom pattern',
  category: 'time',
  priority: 'P1',
  aliases: ['date converter', 'iso 8601', 'rfc 2822', 'rfc 3339', 'format date', 'parse date', 'date format', 'strftime', 'date-fns format'],
  related: ['timestamp-convert', 'week-number'],
  inputKind: 'text',
  example: { input: '2024-05-31T14:30:15Z', expect: 'Fri, 31 May 2024 14:30:15 GMT' },
  load: () => import('./Tool'),
});
