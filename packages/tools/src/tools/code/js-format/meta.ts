import { defineTool } from '@/core/types';

export default defineTool({
  id: 'js-format',
  path: 'code/js-format',
  name: 'JavaScript / TypeScript Formatter',
  description: 'Format JavaScript, JSX and TypeScript with Prettier, with your choice of style options',
  category: 'code',
  audience: 'developer',
  priority: 'P0',
  aliases: ['prettier', 'beautify js', 'js beautifier', 'format typescript', 'format javascript', 'prettify', 'ts formatter', 'jsx formatter'],
  related: ['js-minify', 'css-format', 'sql-format', 'js-benchmark', 'json-format'],
  inputKind: 'text',
  example: { input: 'const add=(a,b)=>{return a+b};console.log(add(1,2))', expect: 'const add = (a, b) => {' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'js-format:js', label: 'Code: format JavaScript (Prettier)', run: (s: string) => m.formatJs(s) },
      { id: 'js-format:ts', label: 'Code: format TypeScript (Prettier)', run: (s: string) => m.formatJs(s, { ...m.DEFAULT_JS_OPTIONS, language: 'typescript' }) },
    ]),
});
