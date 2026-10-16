import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-split',
  path: 'pdf/split',
  name: 'Split & Extract PDF Pages',
  description: 'Pull pages out of a PDF by range, or cut it into several files',
  category: 'pdf',
  priority: 'P0',
  aliases: ['split pdf', 'extract pages', 'cut pdf', 'pdf pages', 'separate pdf'],
  related: ['pdf-merge', 'pdf-organise', 'pdf-rotate'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'Bookmarks and form fields are not carried over to the new files. Password-protected PDFs must be unlocked first (use Unlock PDF).' }],
  load: () => import('./Tool'),
});
