import { defineTool } from '@/core/types';

export default defineTool({
  id: 'math-evaluator',
  path: 'numbers/math',
  name: 'Math Expression Evaluator',
  description: 'A scientific calculator for expressions: functions, units, variables, matrices, fractions and big numbers',
  category: 'numbers',
  audience: 'general',
  priority: 'P1',
  aliases: ['calculator', 'calc', 'mathjs', 'scientific calculator', 'expression', 'formula', 'big number'],
  related: ['unit-converter', 'bitwise-calc', 'number-base'],
  inputKind: 'text',
  example: { input: '2 * (3 + 4) + sqrt(16)', expect: '= 18' },
  load: () => import('./Tool'),
});
