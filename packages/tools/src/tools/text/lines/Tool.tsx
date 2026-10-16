import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Segmented, TextTransform } from '@/ui';
import { applyLineOp, DEFAULT_LINE_OPTIONS, type LineOp } from './logic';

const OPS: ReadonlyArray<{ value: LineOp; label: string }> = [
  { value: 'sort', label: 'Sort' },
  { value: 'dedupe', label: 'Remove duplicates' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'shuffle', label: 'Shuffle' },
  { value: 'trim', label: 'Trim' },
  { value: 'remove-empty', label: 'Remove empty' },
];

export default function LineTools({ initialInput }: ToolProps) {
  const [op, setOp] = useState<LineOp>('sort');
  const [descending, setDescending] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [natural, setNatural] = useState(false);
  const [byLength, setByLength] = useState(false);
  // Shuffle must not re-run on every keystroke of unrelated state, so it is keyed on the options only.
  const modes = useMemo(
    () => [{ id: 'lines', label: 'Run', run: (s: string) => applyLineOp(s, { ...DEFAULT_LINE_OPTIONS, op, descending, ignoreCase, natural, byLength }), filename: 'lines.txt' }],
    [op, descending, ignoreCase, natural, byLength],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Segmented label="Operation" value={op} onChange={setOp} options={OPS} />
          {op === 'sort' && (
            <>
              <Checkbox label="Descending" checked={descending} onChange={setDescending} />
              <Checkbox label="Natural order (2 before 10)" checked={natural} onChange={setNatural} />
              <Checkbox label="By length" checked={byLength} onChange={setByLength} />
            </>
          )}
          {(op === 'sort' || op === 'dedupe') && <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />}
        </OptionsBar>
      }
    />
  );
}
