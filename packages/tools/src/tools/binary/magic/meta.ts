import { defineTool } from '@/core/types';

export default defineTool({
  id: 'magic-detect',
  path: 'binary/magic',
  name: 'Magic Decoder',
  description: 'Work out how a piece of text is encoded (Base64, hex, URL, gzip…) and peel the layers off automatically',
  category: 'binary',
  audience: 'developer',
  priority: 'P2',
  aliases: ['magic', 'cyberchef magic', 'auto decode', 'detect encoding', 'what encoding', 'decode anything', 'unknown encoding'],
  related: ['strings-extract', 'base64-text', 'text-hex'],
  inputKind: 'text',
  restrictions: [{ message: 'Results are guesses ranked by how readable they look. Short or random-looking input can match several encodings, so check the result.' }],
  example: { input: 'SGVsbG8sIHRoaXMgaXMgYSBwZXJmZWN0bHkgbm9ybWFsIHNlbnRlbmNlIHRoYXQgd2FzIGVuY29kZWQgd2l0aCBCYXNlNjQu', expect: 'Base64' },
  load: () => import('./Tool'),
});
