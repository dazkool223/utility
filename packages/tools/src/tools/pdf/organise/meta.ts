import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-organise',
  path: 'pdf/organise',
  name: 'Reorder & Delete PDF Pages',
  description: 'See every page as a thumbnail, then drag to reorder, rotate or delete pages',
  category: 'pdf',
  audience: 'general',
  priority: 'P0',
  aliases: ['reorder pdf', 'delete pdf pages', 'remove pages', 'pdf organiser', 'pdf organizer', 'rearrange pdf', 'page organiser'],
  related: ['pdf-split', 'pdf-merge', 'pdf-rotate'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'Bookmarks and form fields are not carried over to the new file. Password-protected PDFs must be unlocked first (use Unlock PDF).' }],
  load: () => import('./Tool'),
});
