import { defineTool } from '@/core/types';

export default defineTool({
  id: 'text-stats',
  path: 'text/stats',
  name: 'Word Count & Text Statistics',
  description: 'Count words, characters, sentences and paragraphs, and estimate reading time',
  category: 'text',
  priority: 'P0',
  aliases: ['word count', 'character count', 'char count', 'count words', 'reading time', 'letter count', 'sentence count'],
  related: ['line-tools', 'case-convert'],
  inputKind: 'text',
  quickLauncher: true,
  example: { input: 'The quick brown fox jumps over the lazy dog.', expect: 'Words: 9' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'text-stats:report', label: 'Text: statistics report', run: (s: string) => m.statsReport(s) }]),
});
