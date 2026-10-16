import { defineTool } from '@/core/types';

export default defineTool({
  id: 'text-binary',
  path: 'encoders/text-binary',
  name: 'Text ↔ Binary',
  description: 'Convert text to binary, octal, decimal or hex bytes and back',
  category: 'encoders',
  priority: 'P0',
  aliases: ['binary to text', 'text to binary', 'ascii to binary', 'bits', 'bytes'],
  related: ['text-hex', 'base64-text'],
  inputKind: 'text',
  example: { input: 'Hi', expect: '01001000 01101001' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'text-binary:to-binary', label: 'Text: to binary', run: (s: string) => m.textToBytesString(s, 2) },
      { id: 'text-binary:from-binary', label: 'Binary: to text', run: (s: string) => m.bytesStringToText(s, 2) },
    ]),
});
