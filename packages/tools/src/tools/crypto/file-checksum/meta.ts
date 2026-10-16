import { defineTool } from '@/core/types';

export default defineTool({
  id: 'file-checksum',
  path: 'crypto/file-checksum',
  name: 'File Checksum',
  description: 'MD5, SHA-1, SHA-256, SHA-512, BLAKE3 and more for any file, streamed so multi-GB files work',
  category: 'crypto',
  priority: 'P1',
  aliases: ['sha256sum', 'md5sum', 'file hash', 'verify download', 'integrity'],
  related: ['hash-text', 'hmac-generate'],
  inputKind: 'binary',
  accepts: ['file'],
  load: () => import('./Tool'),
});
