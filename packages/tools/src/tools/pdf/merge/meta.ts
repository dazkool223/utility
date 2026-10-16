import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-merge',
  path: 'pdf/merge',
  name: 'Merge PDFs',
  description: 'Combine several PDF files into one, in the order you choose',
  category: 'pdf',
  priority: 'P0',
  aliases: ['combine pdf', 'join pdf', 'concatenate pdf', 'append pdf'],
  related: ['pdf-split', 'pdf-organise', 'images-to-pdf'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'Bookmarks and form fields are not carried over to the merged file. Password-protected PDFs must be unlocked first (use Unlock PDF).' }],
  load: () => import('./Tool'),
});
