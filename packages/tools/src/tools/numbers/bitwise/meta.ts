import { defineTool } from '@/core/types';

export default defineTool({
  id: 'bitwise-calc',
  path: 'numbers/bitwise',
  name: 'Bitwise Calculator',
  description: 'Evaluate AND, OR, XOR, NOT, shifts and rotates at 8, 16, 32 or 64 bits, and see every bit',
  category: 'numbers',
  audience: 'developer',
  priority: 'P1',
  aliases: ['bit shift', 'xor calculator', 'and or xor', 'binary operations', 'popcount', 'bit manipulation', 'twos complement'],
  related: ['number-base', 'math-evaluator', 'ip-format'],
  inputKind: 'text',
  example: { input: '0xFF & 0x0F', expect: '0x0000000F' },
  load: () => import('./Tool'),
});
