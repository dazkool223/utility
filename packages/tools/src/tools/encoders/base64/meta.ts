import { defineTool } from '@/core/types';

export default defineTool({
  id: 'base64-text',
  path: 'encoders/base64',
  name: 'Base64 Encode / Decode',
  description: 'Encode text to Base64 or decode it back, including URL-safe Base64',
  category: 'encoders',
  priority: 'P0',
  aliases: ['b64', 'atob', 'btoa'],
  related: ['json-format', 'base64-file', 'url-encode', 'jwt-decode', 'text-hex', 'gzip-text'],
  inputKind: 'text',
  accepts: ['base64'],
  quickLauncher: true,
  contextMenu: 'Decode Base64',
  example: { input: 'Hello, world!', expect: 'SGVsbG8sIHdvcmxkIQ==' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'base64:encode', label: 'Base64: encode', run: (s: string) => m.encodeBase64(s, false) },
      { id: 'base64:decode', label: 'Base64: decode', run: m.decodeBase64 },
    ]),
});
