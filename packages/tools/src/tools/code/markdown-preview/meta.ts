import { defineTool } from '@/core/types';

export default defineTool({
  id: 'markdown-preview',
  path: 'code/markdown-preview',
  name: 'Markdown Preview',
  description: 'Write Markdown and see it rendered live, GitHub style',
  category: 'code',
  priority: 'P0',
  aliases: ['markdown viewer', 'markdown editor', 'md preview', 'readme preview', 'render markdown', 'gfm preview'],
  related: ['markdown-html', 'markdown-table', 'text-stats'],
  inputKind: 'text',
  accepts: ['markdown'],
  restrictions: [{ message: 'Images from other websites are not loaded, because this app makes no network requests. Embedded (data:) images are shown.' }],
  example: { input: '# Hello preview\n\nSome **bold** text and a list:\n\n- one\n- two', expect: 'Hello preview' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'markdown-preview:sanitized-html', label: 'Markdown: render to sanitised HTML', run: (s: string) => m.renderPreview(s) },
      { id: 'markdown-preview:text', label: 'Markdown: render to plain text', run: (s: string) => m.renderedText(s) },
    ]),
});
