import { defineTool } from '@/core/types';

export default defineTool({
  id: 'gzip-file',
  path: 'archives/gzip-file',
  name: 'Gzip / Gunzip File',
  description: 'Compress a file to .gz or decompress a .gz file, streamed in your browser',
  category: 'archives',
  priority: 'P1',
  aliases: ['gzip', 'gunzip', '.gz', 'compress file', 'decompress file', 'ungzip'],
  related: ['gzip-text'],
  inputKind: 'binary',
  accepts: ['gzip'],
  restrictions: [{ message: 'This browser does not support CompressionStream, so gzip and gunzip are unavailable here.', applies: () => typeof CompressionStream === 'undefined' }],
  load: () => import('./Tool'),
});
