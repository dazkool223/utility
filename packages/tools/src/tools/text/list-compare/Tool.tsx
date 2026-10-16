import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select } from '@/ui';
import { TwoInputTool } from '../_lib/TwoInputTool';
import { compareLists, type SetOp } from './logic';

const SAMPLE = { a: 'apple\nbanana\ncherry\ndate', b: 'banana\ndate\nelderberry\nfig' };

export default function ListCompare({ initialInput }: ToolProps) {
  const [op, setOp] = useState<SetOp>('a-only');
  const [trim, setTrim] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const compute = (a: string, b: string) => {
    const r = compareLists(a, b, { op, trim, ignoreCase });
    const c = r.counts;
    return {
      text: r.items.join('\n'),
      view: (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs text-muted-foreground">
            List A: {c.a} · List B: {c.b} · In both: {c.both} · Only in A: {c.aOnly} · Only in B: {c.bOnly} · Result: {r.items.length}
          </p>
          <pre className="m-0 whitespace-pre-wrap break-all">{r.items.join('\n') || '(no items)'}</pre>
        </div>
      ),
    };
  };
  return (
    <TwoInputTool
      labelA="List A (one item per line)"
      labelB="List B"
      compute={compute}
      deps={[op, trim, ignoreCase]}
      initialInput={initialInput}
      sample={SAMPLE}
      filename="result.txt"
      options={
        <OptionsBar>
          <Select
            label="Show"
            value={op}
            onChange={setOp}
            options={[
              { value: 'a-only', label: 'Only in A' },
              { value: 'b-only', label: 'Only in B' },
              { value: 'intersection', label: 'In both (intersection)' },
              { value: 'union', label: 'In either (union)' },
              { value: 'symmetric', label: 'In one but not both' },
            ]}
          />
          <Checkbox label="Trim whitespace" checked={trim} onChange={setTrim} />
          <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        </OptionsBar>
      }
    />
  );
}
