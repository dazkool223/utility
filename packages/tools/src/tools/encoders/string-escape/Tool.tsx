import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { escapeString, LANGS, unescapeString, type EscapeLang } from './logic';

export default function StringEscape({ initialInput }: ToolProps) {
  const [lang, setLang] = useState<EscapeLang>('js');
  const [ascii, setAscii] = useState(false);
  const modes = useMemo(
    () => [
      { id: 'escape', label: 'Escape', run: (s: string) => escapeString(s, lang, ascii), filename: 'escaped.txt' },
      { id: 'unescape', label: 'Unescape', run: (s: string) => unescapeString(s, lang), filename: 'unescaped.txt' },
    ],
    [lang, ascii],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select label="Language" value={lang} onChange={setLang} options={LANGS} />
          {(lang === 'js' || lang === 'json' || lang === 'java' || lang === 'csharp') && <Checkbox label="Escape non-ASCII as \u" checked={ascii} onChange={setAscii} />}
        </OptionsBar>
      }
    />
  );
}
