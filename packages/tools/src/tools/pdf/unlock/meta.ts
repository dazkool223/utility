import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-unlock',
  path: 'pdf/unlock',
  name: 'Unlock PDF',
  description: 'Remove the password and the print, copy and edit limits from a PDF you have the password for',
  category: 'pdf',
  priority: 'P0',
  aliases: ['decrypt pdf', 'remove pdf password', 'remove pdf restrictions', 'unprotect pdf', 'pdf password remover'],
  related: ['pdf-protect', 'pdf-merge', 'pdf-split'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [{ message: 'You need the password. Guessing or cracking unknown passwords is not possible here. Metadata stored in the PDF info dictionary may be dropped.' }],
  load: () => import('./Tool'),
});
