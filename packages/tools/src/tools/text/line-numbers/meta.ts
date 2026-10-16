import { defineTool } from '@/core/types';

export default defineTool({
  id: 'line-numbers',
  path: 'text/line-numbers',
  name: 'Line Numbers, Prefix & Wrap',
  description: 'Add or remove line numbers, add a prefix or suffix to every line, and wrap long lines',
  category: 'text',
  priority: 'P1',
  aliases: ['add line numbers', 'number lines', 'prefix lines', 'suffix lines', 'wrap text', 'word wrap', 'quote each line', 'add quotes to lines'],
  related: ['line-tools', 'whitespace-cleanup'],
  inputKind: 'text',
  example: { input: 'alpha\nbeta\ngamma', expect: '2: beta' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'line-numbers:add', label: 'Lines: add line numbers', run: (s: string) => m.decorateLines(s, m.DEFAULT_DECORATE) },
      { id: 'line-numbers:remove', label: 'Lines: remove line numbers', run: (s: string) => m.removeLineNumbers(s) },
      { id: 'line-numbers:quote', label: 'Lines: wrap each line in quotes with a comma', run: (s: string) => m.decorateLines(s, { ...m.DEFAULT_DECORATE, numbers: false, prefix: '"', suffix: '",' }) },
    ]),
});
