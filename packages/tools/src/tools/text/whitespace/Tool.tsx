import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { cleanWhitespace, DEFAULT_WHITESPACE, type WhitespaceOptions } from './logic';

export default function WhitespaceCleanup({ initialInput }: ToolProps) {
  const [o, setO] = useState<WhitespaceOptions>(DEFAULT_WHITESPACE);
  const set = <K extends keyof WhitespaceOptions>(k: K, v: WhitespaceOptions[K]) => setO((prev) => ({ ...prev, [k]: v }));
  const modes = useMemo(() => [{ id: 'clean', label: 'Clean', run: (s: string) => cleanWhitespace(s, o), filename: 'cleaned.txt' }], [o]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Trim each line" checked={o.trimLines} onChange={(v) => set('trimLines', v)} />
          <Checkbox label="Collapse repeated spaces" checked={o.collapseSpaces} onChange={(v) => set('collapseSpaces', v)} />
          <Checkbox label="Tabs to 4 spaces" checked={o.tabsToSpaces} onChange={(v) => set('tabsToSpaces', v)} />
          <Checkbox label="Collapse blank lines" checked={o.collapseBlankLines} onChange={(v) => set('collapseBlankLines', v)} />
          <Checkbox label="Remove all blank lines" checked={o.removeBlankLines} onChange={(v) => set('removeBlankLines', v)} />
          <Checkbox label="Join lines into one" checked={o.joinLines} onChange={(v) => set('joinLines', v)} />
          <Checkbox label="Remove zero-width characters" checked={o.stripInvisible} onChange={(v) => set('stripInvisible', v)} />
          <Select
            label="Line endings"
            value={o.lineEnding}
            onChange={(v) => set('lineEnding', v)}
            options={[
              { value: 'keep', label: 'Keep' },
              { value: 'lf', label: 'LF (Unix)' },
              { value: 'crlf', label: 'CRLF (Windows)' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
