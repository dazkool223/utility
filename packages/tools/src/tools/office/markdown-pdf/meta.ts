import { defineTool } from '@/core/types';

export default defineTool({
  id: 'markdown-pdf',
  path: 'office/markdown-pdf',
  name: 'Markdown / HTML → PDF',
  description: 'Turn Markdown or HTML into a print-ready page and save it as a PDF with your browser',
  category: 'office',
  priority: 'P2',
  aliases: ['markdown to pdf', 'html to pdf', 'md to pdf', 'print to pdf', 'save as pdf', 'document to pdf'],
  inputKind: 'text',
  restrictions: [
    { message: 'The PDF is made by your browser’s print dialog (choose "Save as PDF"), so fonts, page breaks and headers depend on the browser. Images must be embedded (data: URIs); web images are not loaded.' },
  ],
  example: { input: '# Hello PDF\n\nSome *formatted* text.', expect: 'Hello PDF' },
  load: () => import('./Tool'),
});
