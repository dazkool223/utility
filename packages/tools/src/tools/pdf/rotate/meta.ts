import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-rotate',
  path: 'pdf/rotate',
  name: 'Rotate PDF Pages',
  description: 'Turn all pages, or only the pages you pick, by 90, 180 or 270 degrees',
  category: 'pdf',
  priority: 'P0',
  aliases: ['rotate pdf', 'turn pdf', 'flip pdf pages', 'landscape to portrait'],
  related: ['pdf-organise', 'pdf-split', 'pdf-merge'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'Password-protected PDFs must be unlocked first (use Unlock PDF).' }],
  load: () => import('./Tool'),
});
