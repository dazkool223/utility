import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextTransform } from '@/ui';
import { ansiToHtml, stripAnsi } from './logic';

export default function AnsiTools({ initialInput }: ToolProps) {
  const [bare, setBare] = useState(true);
  const [pre, setPre] = useState(true);
  const modes = useMemo(
    () => [
      { id: 'strip', label: 'Strip codes', run: (s: string) => stripAnsi(s, bare), filename: 'clean.txt' },
      { id: 'html', label: 'ANSI → HTML', run: (s: string) => ansiToHtml(s, pre), outputLanguage: 'html' as const, filename: 'output.html' },
    ],
    [bare, pre],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label={'Also remove codes whose ESC was lost, like [0;32m'} checked={bare} onChange={setBare} />
          <Checkbox label="Wrap HTML in <pre>" checked={pre} onChange={setPre} />
        </OptionsBar>
      }
    />
  );
}
