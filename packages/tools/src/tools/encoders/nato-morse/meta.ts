import { defineTool } from '@/core/types';

export default defineTool({
  id: 'nato-morse',
  path: 'encoders/nato-morse',
  name: 'NATO Alphabet & Morse Code',
  description: 'Spell text with the NATO phonetic alphabet or convert it to and from Morse code',
  category: 'encoders',
  audience: 'general',
  priority: 'P1',
  aliases: ['phonetic alphabet', 'nato', 'morse', 'morse code', 'alfa bravo charlie', 'icao spelling'],
  related: ['text-binary', 'text-hex'],
  inputKind: 'text',
  example: { input: 'SOS', expect: 'Sierra Oscar Sierra' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'nato-morse:to-nato', label: 'Text: to NATO alphabet', run: (s: string) => m.textToNato(s) },
      { id: 'nato-morse:to-morse', label: 'Text: to Morse code', run: (s: string) => m.textToMorse(s) },
      { id: 'nato-morse:from-morse', label: 'Morse code: to text', run: (s: string) => m.morseToText(s) },
    ]),
});
