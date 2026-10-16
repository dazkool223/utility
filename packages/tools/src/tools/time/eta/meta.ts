import { defineTool } from '@/core/types';

export default defineTool({
  id: 'eta-calculator',
  path: 'time/eta',
  name: 'ETA Calculator',
  description: 'Estimate when a job will finish from how much is done and how long it has taken',
  category: 'time',
  audience: 'general',
  priority: 'P2',
  aliases: ['time remaining', 'progress estimate', 'finish time', 'completion time', 'duration calculator'],
  related: ['week-number', 'timestamp-convert', 'stopwatch'],
  inputKind: 'none',
  load: () => import('./Tool'),
});
