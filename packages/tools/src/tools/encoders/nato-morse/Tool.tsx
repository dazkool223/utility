import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { morseToText, natoToText, textToMorse, textToNato } from './logic';

const modes = [
  { id: 'nato', label: 'Text → NATO', run: textToNato, filename: 'nato.txt' },
  { id: 'nato-back', label: 'NATO → text', run: natoToText, filename: 'text.txt' },
  { id: 'morse', label: 'Text → Morse', run: textToMorse, filename: 'morse.txt' },
  { id: 'morse-back', label: 'Morse → text', run: morseToText, filename: 'text.txt' },
];

export default function NatoMorse({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
