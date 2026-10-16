import { defineTool } from '@/core/types';

export default defineTool({
  id: 'colour-converter',
  path: 'numbers/colour',
  name: 'Colour Converter',
  description: 'Convert colours between HEX, RGB, HSL, HWB, LAB, LCH, OKLAB and OKLCH, with a swatch and contrast check',
  category: 'numbers',
  priority: 'P0',
  aliases: ['color converter', 'hex to rgb', 'rgb to hex', 'hsl', 'oklch', 'css color', 'color picker', 'contrast ratio'],
  related: ['unit-converter', 'number-base'],
  inputKind: 'text',
  accepts: ['color'],
  quickLauncher: true,
  contextMenu: 'Convert colour',
  example: { input: 'rebeccapurple', expect: 'rgb(102 51 153)' },
  load: () => import('./Tool'),
});
