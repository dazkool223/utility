import { defineTool } from '@/core/types';

export default defineTool({
  id: 'week-number',
  path: 'time/week-number',
  name: 'Week Number & Day of Year',
  description: 'Find the ISO week number, day of year, quarter and week boundaries for any date',
  category: 'time',
  audience: 'general',
  priority: 'P2',
  aliases: ['iso week', 'week of year', 'day of year', 'julian day', 'calendar week', 'kw', 'ordinal date'],
  related: ['timestamp-convert', 'date-format', 'eta-calculator'],
  inputKind: 'text',
  example: { input: '2024-05-31', expect: 'ISO week: 2024-W22' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'week-number:report', label: 'Time: week number and day of year', run: (s: string) => m.weekNumbers(s) },
      { id: 'week-number:iso-week', label: 'Time: ISO week label (2024-W22)', run: (s: string) => m.isoWeekLabels(s) },
    ]),
});
