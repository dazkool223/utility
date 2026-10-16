import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-to-images',
  path: 'pdf/to-images',
  name: 'PDF to Images',
  description: 'Turn PDF pages into PNG or JPG images at the resolution you choose',
  category: 'pdf',
  priority: 'P1',
  aliases: ['pdf to png', 'pdf to jpg', 'pdf to jpeg', 'render pdf', 'pdf screenshot', 'pdf pages to images'],
  related: ['images-to-pdf', 'pdf-split', 'pdf-ocr'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'Memory use grows with resolution and page count. At 300 dpi, long documents may need to be done in batches. Password-protected PDFs must be unlocked first (use Unlock PDF).' }],
  load: () => import('./Tool'),
});
