import { defineTool } from '@/core/types';

export default defineTool({
  id: 'text-hex',
  path: 'encoders/text-hex',
  name: 'Text ↔ Hex / Hexdump',
  description: 'Convert text to hex bytes and back, or print a classic hexdump',
  category: 'encoders',
  priority: 'P1',
  aliases: ['hex encode', 'hex decode', 'hex to text', 'text to hex', 'xxd', 'hexdump', 'hex dump'],
  related: ['text-binary', 'base64-text'],
  inputKind: 'text',
  accepts: ['hex'],
  example: { input: 'Hello', expect: '48 65 6c 6c 6f' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'text-hex:to-hex', label: 'Text: to hex', run: (s: string) => m.textToHex(s, { separator: 'space', uppercase: false }) },
      { id: 'text-hex:from-hex', label: 'Hex: to text', run: (s: string) => m.hexToText(s) },
      { id: 'text-hex:hexdump', label: 'Text: hexdump', run: (s: string) => m.hexdump(s) },
    ]),
});
