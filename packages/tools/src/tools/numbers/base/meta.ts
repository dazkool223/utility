import { defineTool } from '@/core/types';

export default defineTool({
  id: 'number-base',
  path: 'numbers/base',
  name: 'Number Base Converter',
  description: 'Convert whole numbers of any size between binary, octal, decimal, hex and any base up to 62',
  category: 'numbers',
  audience: 'general',
  priority: 'P0',
  aliases: ['binary to decimal', 'hex to decimal', 'decimal to hex', 'decimal to binary', 'bin2dec', 'hex2dec', 'radix', 'base36', 'base62'],
  related: ['bitwise-calc', 'ip-format', 'unit-converter'],
  inputKind: 'text',
  quickLauncher: true,
  example: { input: '0xFF', expect: '1111 1111' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'number-base:hex-to-dec', label: 'Number: hex to decimal', run: (s: string) => m.convertBase(s, 16, 10) },
      { id: 'number-base:dec-to-hex', label: 'Number: decimal to hex', run: (s: string) => m.convertBase(s, 10, 16) },
      { id: 'number-base:dec-to-bin', label: 'Number: decimal to binary', run: (s: string) => m.convertBase(s, 10, 2) },
      { id: 'number-base:bin-to-dec', label: 'Number: binary to decimal', run: (s: string) => m.convertBase(s, 2, 10) },
    ]),
});
