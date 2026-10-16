import { defineTool } from '@/core/types';

export default defineTool({
  id: 'chmod-calc',
  path: 'code/chmod',
  name: 'chmod Calculator',
  description: 'Convert Unix file permissions between octal (755) and symbolic (rwxr-xr-x) and see what each means',
  category: 'code',
  priority: 'P1',
  aliases: ['file permissions', 'unix permissions', 'octal permissions', 'rwx', 'umask', 'chmod 755', 'linux permissions'],
  related: ['number-base', 'bitwise-calc', 'js-benchmark'],
  inputKind: 'text',
  example: { input: '755', expect: 'rwxr-xr-x' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'chmod-calc:octal', label: 'Unix permissions: to octal', run: (s: string) => m.octalOf(s) },
      { id: 'chmod-calc:symbolic', label: 'Unix permissions: to symbolic (rwx)', run: (s: string) => m.symbolicOf(s) },
    ]),
});
