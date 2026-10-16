import { defineTool } from '@/core/types';

export default defineTool({
  id: 'gzip-text',
  path: 'encoders/gzip',
  name: 'Gzip / Deflate Text',
  description: 'Compress text with gzip or deflate and get Base64, or decompress Base64 back to text',
  category: 'encoders',
  priority: 'P1',
  aliases: ['gzip', 'gunzip', 'deflate', 'inflate', 'compress text', 'zlib'],
  related: ['base64-text', 'text-hex'],
  inputKind: 'text',
  restrictions: [{ message: 'This browser does not support CompressionStream, so gzip and deflate are unavailable here.', applies: () => typeof CompressionStream === 'undefined' }],
  example: { input: 'hello hello hello hello', expect: 'H4sI' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'gzip-text:compress', label: 'Gzip: compress to Base64', run: (s: string) => m.compressToBase64(s, 'gzip') },
      { id: 'gzip-text:decompress', label: 'Gzip: decompress from Base64', run: (s: string) => m.decompressFromBase64(s, 'auto') },
    ]),
});
