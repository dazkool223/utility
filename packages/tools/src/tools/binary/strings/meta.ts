import { defineTool } from '@/core/types';

export default defineTool({
  id: 'strings-extract',
  path: 'binary/strings',
  name: 'Strings Extractor',
  description: 'Pull readable text (ASCII and UTF-16) out of any binary file, with offsets',
  category: 'binary',
  audience: 'developer',
  priority: 'P2',
  aliases: ['strings', 'extract text from binary', 'printable strings', 'binary strings', 'exe strings'],
  related: ['text-hex', 'file-checksum', 'magic-detect'],
  inputKind: 'binary',
  accepts: ['file'],
  restrictions: [{ message: 'Shows at most 100,000 strings. Raise the minimum length to narrow the results on very large files.' }],
  load: () => import('./Tool'),
});
