import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-protect',
  path: 'pdf/protect',
  name: 'Password Protect PDF',
  description: 'Lock a PDF with a password using AES-256 encryption, and choose what readers may do',
  category: 'pdf',
  priority: 'P0',
  aliases: ['encrypt pdf', 'lock pdf', 'pdf password', 'secure pdf', 'aes pdf'],
  related: ['pdf-unlock', 'pdf-merge'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [
    { message: 'There is no way to recover a lost password. Keep it somewhere safe. Print, copy and edit limits are honoured by most PDF viewers but are not enforced by the encryption itself.' },
  ],
  load: () => import('./Tool'),
});
