import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextTransform } from '@/ui';
import { stringifyText, unstringifyText } from './logic';

export default function JsonEscape({ initialInput }: ToolProps) {
  const [ascii, setAscii] = useState(false);
  const modes = useMemo(
    () => [
      { id: 'escape', label: 'Escape', run: (s: string) => stringifyText(s, ascii), filename: 'escaped.txt' },
      { id: 'unescape', label: 'Unescape', run: unstringifyText, filename: 'unescaped.txt' },
    ],
    [ascii],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Escape non-ASCII as \uXXXX" checked={ascii} onChange={setAscii} />
        </OptionsBar>
      }
    />
  );
}
