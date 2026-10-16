import { useCallback, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, GeneratorTool, NumberInput, OptionsBar, Segmented } from '@/ui';
import { DecoderTool } from '../_lib/DecoderTool';
import { MAX_COUNT, decodeUlid, generateUlids } from './logic';

function Generate() {
  const [count, setCount] = useState(1);
  const [monotonic, setMonotonic] = useState(true);
  const [lowercase, setLowercase] = useState(false);
  const generate = useCallback(() => generateUlids({ count, monotonic, lowercase }), [count, monotonic, lowercase]);
  return (
    <GeneratorTool
      generate={generate}
      filename="ulids.txt"
      options={
        <OptionsBar>
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
          <Checkbox label="Monotonic (sorted within a millisecond)" checked={monotonic} onChange={setMonotonic} />
          <Checkbox label="Lowercase" checked={lowercase} onChange={setLowercase} />
        </OptionsBar>
      }
    />
  );
}

export default function UlidTool({ initialInput }: ToolProps) {
  const [mode, setMode] = useState<'decode' | 'generate'>(initialInput ? 'decode' : 'decode');
  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'decode', label: 'Decode' },
          { value: 'generate', label: 'Generate' },
        ]}
      />
      {mode === 'generate' ? (
        <Generate />
      ) : (
        <DecoderTool
          initialInput={initialInput}
          placeholder="Paste a ULID, e.g. 01ARZ3NDEKTSV4RRFFQ69G5FAV"
          decode={(s) => {
            const d = decodeUlid(s);
            return [
              ['ULID', d.id],
              ['Timestamp (ms)', String(d.timestampMs)],
              ['Time (UTC)', d.iso],
              ['Randomness (hex)', d.randomHex],
              ['As UUID', d.uuid],
            ];
          }}
        />
      )}
    </div>
  );
}
