import { defineTool } from '@/core/types';

export default defineTool({
  id: 'stopwatch',
  path: 'time/stopwatch',
  name: 'Stopwatch',
  description: 'A stopwatch with lap times that runs in your browser',
  category: 'time',
  priority: 'P2',
  aliases: ['timer', 'lap timer', 'chronometer', 'elapsed time'],
  related: ['eta-calculator', 'timestamp-convert'],
  inputKind: 'none',
  load: () => import('./Tool'),
});
