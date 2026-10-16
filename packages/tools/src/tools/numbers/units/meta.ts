import { defineTool } from '@/core/types';

export default defineTool({
  id: 'unit-converter',
  path: 'numbers/units',
  name: 'Unit Converter',
  description: 'Convert length, mass, temperature, time, data size, speed, area, volume, pressure, energy and more',
  category: 'numbers',
  audience: 'general',
  priority: 'P0',
  aliases: ['convert units', 'km to miles', 'celsius to fahrenheit', 'kg to lb', 'bytes to gb', 'mib', 'metric imperial'],
  related: ['number-base', 'math-evaluator'],
  inputKind: 'text',
  quickLauncher: true,
  example: { input: '5 km', expect: '3.10685596119' },
  load: () => import('./Tool'),
});
