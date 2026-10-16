import { defineTool } from '@/core/types';

export default defineTool({
  id: 'timestamp-convert',
  path: 'time/timestamp',
  name: 'Unix Timestamp Converter',
  description: 'Convert Unix timestamps (seconds, milliseconds, microseconds, nanoseconds) to dates and dates back',
  category: 'time',
  priority: 'P0',
  aliases: ['epoch', 'unix time', 'unix timestamp', 'epoch converter', 'timestamp to date', 'date to timestamp', 'posix time'],
  related: ['date-format', 'week-number'],
  inputKind: 'text',
  accepts: ['timestamp'],
  quickLauncher: true,
  contextMenu: 'Convert timestamp',
  example: { input: '1700000000', expect: '2023-11-14T22:13:20.000Z' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'timestamp-convert:to-iso', label: 'Time: Unix timestamp to ISO date', run: (s: string) => m.timestampToIso(s) },
      { id: 'timestamp-convert:to-unix', label: 'Time: date to Unix seconds', run: (s: string) => m.dateToUnixSeconds(s) },
    ]),
});
