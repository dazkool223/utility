import { defineTool } from '@/core/types';

export default defineTool({
  id: 'css-minify',
  path: 'code/css-minify',
  name: 'CSS Minifier',
  description: 'Shrink CSS by removing whitespace and comments and simplifying values (csso)',
  category: 'code',
  priority: 'P1',
  aliases: ['compress css', 'minify css', 'css compressor', 'csso', 'css optimizer'],
  related: ['css-format', 'js-minify', 'colour-converter'],
  inputKind: 'text',
  example: { input: 'a {\n  color: #ff0000;\n  margin: 0px auto;\n}\n/* note */\nb { }', expect: 'a{color:red;margin:0 auto}' },
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'css-minify:default', label: 'CSS: minify (csso)', run: (s: string) => m.minifyCss(s) }]),
});
