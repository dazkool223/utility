import { defineTool } from '@/core/types';

export default defineTool({
  id: 'cron-parser',
  path: 'time/cron',
  name: 'Cron Expression Parser & Builder',
  description: 'Explain a cron expression in plain English and list its next runs, for Unix, Kubernetes, Spring, Quartz and AWS cron',
  category: 'time',
  priority: 'P1',
  aliases: ['crontab', 'cron expression', 'cron schedule', 'cron generator', 'cron builder', 'quartz cron', 'cronjob', 'next run'],
  related: ['timestamp-convert', 'date-format'],
  inputKind: 'text',
  accepts: ['cron'],
  restrictions: [{ message: 'Cron dialects differ (weekday numbering, seconds, ? and L). Pick the dialect that matches where the schedule will run.' }],
  example: { input: '*/5 * * * *', expect: 'Every 5 minutes' },
  load: () => import('./Tool'),
});
