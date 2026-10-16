import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, NumberInput, OptionsBar, TextInput, TextTransform } from '@/ui';
import { decorateLines, DEFAULT_DECORATE, removeLineNumbers, type DecorateOptions } from './logic';

export default function LineNumbers({ initialInput }: ToolProps) {
  const [o, setO] = useState<DecorateOptions>(DEFAULT_DECORATE);
  const set = <K extends keyof DecorateOptions>(k: K, v: DecorateOptions[K]) => setO((prev) => ({ ...prev, [k]: v }));
  const modes = useMemo(
    () => [
      { id: 'add', label: 'Decorate', run: (s: string) => decorateLines(s, o), filename: 'lines.txt' },
      { id: 'remove', label: 'Remove numbers', run: removeLineNumbers, filename: 'lines.txt' },
    ],
    [o],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Line numbers" checked={o.numbers} onChange={(v) => set('numbers', v)} />
          <NumberInput label="Start at" value={o.start} onChange={(v) => set('start', v)} min={0} />
          <TextInput label="After number" value={o.separator} onChange={(v) => set('separator', v)} monospace className="w-24" />
          <Checkbox label="Align numbers" checked={o.padNumbers} onChange={(v) => set('padNumbers', v)} />
          <Checkbox label="Skip empty lines" checked={o.skipEmpty} onChange={(v) => set('skipEmpty', v)} />
          <TextInput label="Prefix" value={o.prefix} onChange={(v) => set('prefix', v)} monospace className="w-28" />
          <TextInput label="Suffix" value={o.suffix} onChange={(v) => set('suffix', v)} monospace className="w-28" />
          <NumberInput label="Wrap at (0 = off)" value={o.wrap} onChange={(v) => set('wrap', v)} min={0} />
        </OptionsBar>
      }
    />
  );
}
