import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ansi-tools',
  path: 'text/ansi',
  name: 'ANSI Escape Remover & ANSI to HTML',
  description: 'Strip terminal colour codes from text, or turn ANSI-coloured output into HTML',
  category: 'text',
  audience: 'developer',
  priority: 'P2',
  aliases: ['strip ansi', 'remove ansi', 'ansi to html', 'terminal colors', 'escape codes', 'remove color codes', 'ansi colors'],
  related: ['html-entities', 'whitespace-cleanup'],
  inputKind: 'text',
  example: { input: '\u001b[31mError:\u001b[0m something \u001b[1mfailed\u001b[0m', expect: 'Error: something failed' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'ansi-tools:strip', label: 'ANSI: strip escape codes', run: (s: string) => m.stripAnsi(s, true) },
      { id: 'ansi-tools:to-html', label: 'ANSI: to HTML', run: (s: string) => m.ansiToHtml(s, true) },
    ]),
});
