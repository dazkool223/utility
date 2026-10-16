import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { escapeUnicode, FORMATS, listCodePoints, unescapeUnicode, type UnicodeFormat } from './logic';

export default function UnicodeEscape({ initialInput }: ToolProps) {
  const [format, setFormat] = useState<UnicodeFormat>('u4');
  const [onlyNonAscii, setOnlyNonAscii] = useState(false);
  const modes = useMemo(
    () => [
      { id: 'escape', label: 'Escape', run: (s: string) => escapeUnicode(s, format, onlyNonAscii), filename: 'escaped.txt' },
      { id: 'unescape', label: 'Unescape', run: unescapeUnicode, filename: 'text.txt' },
      { id: 'inspect', label: 'Code points', run: listCodePoints, filename: 'codepoints.txt' },
    ],
    [format, onlyNonAscii],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select label="Escape format" value={format} onChange={setFormat} options={FORMATS} />
          <Checkbox label="Keep ASCII as it is" checked={onlyNonAscii} onChange={setOnlyNonAscii} />
        </OptionsBar>
      }
    />
  );
}
