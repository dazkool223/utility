import { defineTool } from '@/core/types';

export default defineTool({
  id: 'markdown-html',
  path: 'code/markdown-html',
  name: 'Markdown to HTML',
  description: 'Convert Markdown (including GitHub-style tables and task lists) into HTML source code',
  category: 'code',
  audience: 'developer',
  priority: 'P0',
  aliases: ['md to html', 'markdown converter', 'markdown to html', 'md2html', 'marked', 'gfm'],
  related: ['markdown-preview', 'markdown-table', 'html-entities', 'js-format'],
  inputKind: 'text',
  accepts: ['markdown'],
  example: { input: '# Hello\n\nSome **bold** text and a [link](https://example.com).', expect: '<strong>bold</strong>' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'markdown-html:convert', label: 'Markdown: convert to HTML', run: (s: string) => m.mdToHtml(s) },
      { id: 'markdown-html:sanitized', label: 'Markdown: convert to sanitised HTML', run: (s: string) => m.mdToHtml(s, { ...m.DEFAULT_MD_HTML, sanitize: true }) },
    ]),
});
