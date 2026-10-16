import { defineTool } from '@/core/types';

export default defineTool({
  id: 'js-minify',
  path: 'code/js-minify',
  name: 'JavaScript Minifier',
  description: 'Shrink JavaScript by removing whitespace and comments and shortening names (Terser)',
  category: 'code',
  audience: 'developer',
  priority: 'P1',
  aliases: ['uglify', 'uglifyjs', 'terser', 'compress js', 'minify javascript', 'js compressor'],
  related: ['js-format', 'css-minify', 'js-benchmark', 'json-minify'],
  inputKind: 'text',
  restrictions: [{ message: 'Plain JavaScript only. TypeScript and JSX must be compiled to JavaScript first.' }],
  example: { input: 'function add(first, second) {\n  // sum\n  return first + second;\n}\nconsole.log(add(1, 2));', expect: 'function add(' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'js-minify:default', label: 'Code: minify JavaScript (Terser)', run: (s: string) => m.minifyJs(s) }]),
});
