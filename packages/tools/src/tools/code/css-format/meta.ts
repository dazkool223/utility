import { defineTool } from '@/core/types';

export default defineTool({
  id: 'css-format',
  path: 'code/css-format',
  name: 'CSS Formatter',
  description: 'Beautify CSS, SCSS and Less with consistent indentation',
  category: 'code',
  priority: 'P1',
  aliases: ['css beautifier', 'css prettify', 'beautify css', 'format scss', 'format less', 'css pretty print'],
  related: ['css-minify', 'js-format', 'sql-format', 'colour-converter'],
  inputKind: 'text',
  example: { input: 'a{color:red;margin:0 auto}.card>h1{font:700 2rem/1.2 sans-serif}', expect: 'margin: 0 auto;' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'css-format:css', label: 'CSS: format (2 spaces)', run: (s: string) => m.formatCss(s) },
      { id: 'css-format:scss', label: 'SCSS: format (2 spaces)', run: (s: string) => m.formatCss(s, { ...m.DEFAULT_CSS_OPTIONS, language: 'scss' }) },
    ]),
});
