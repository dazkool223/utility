import { defineTool } from '@/core/types';

export default defineTool({
  id: 'line-tools',
  path: 'text/lines',
  name: 'Line Tools',
  description: 'Sort, deduplicate, reverse, shuffle and trim lines of text',
  category: 'text',
  priority: 'P0',
  aliases: ['sort lines', 'remove duplicate lines', 'dedupe', 'unique lines', 'reverse lines', 'shuffle lines', 'randomize lines', 'trim lines', 'sort alphabetically'],
  related: ['list-compare', 'whitespace-cleanup', 'line-numbers', 'case-convert'],
  inputKind: 'text',
  example: { input: 'pear\napple\nbanana\napple', expect: 'banana' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => {
      const o = m.DEFAULT_LINE_OPTIONS;
      return [
        { id: 'lines:sort', label: 'Lines: sort A-Z', run: (s: string) => m.applyLineOp(s, { ...o, op: 'sort' }) },
        { id: 'lines:sort-desc', label: 'Lines: sort Z-A', run: (s: string) => m.applyLineOp(s, { ...o, op: 'sort', descending: true }) },
        { id: 'lines:dedupe', label: 'Lines: remove duplicates', run: (s: string) => m.applyLineOp(s, { ...o, op: 'dedupe' }) },
        { id: 'lines:reverse', label: 'Lines: reverse order', run: (s: string) => m.applyLineOp(s, { ...o, op: 'reverse' }) },
        { id: 'lines:shuffle', label: 'Lines: shuffle', run: (s: string) => m.applyLineOp(s, { ...o, op: 'shuffle' }) },
        { id: 'lines:trim', label: 'Lines: trim each line', run: (s: string) => m.applyLineOp(s, { ...o, op: 'trim' }) },
        { id: 'lines:remove-empty', label: 'Lines: remove empty lines', run: (s: string) => m.applyLineOp(s, { ...o, op: 'remove-empty' }) },
      ];
    }),
});
