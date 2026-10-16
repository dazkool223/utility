import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { NumberInput, OptionsBar, TextTransform } from '@/ui';
import { magicReport } from './logic';

export default function MagicTool({ initialInput }: ToolProps) {
  const [depth, setDepth] = useState(3);
  return (
    <TextTransform
      initialInput={initialInput}
      inputPlaceholder="Paste encoded or unknown text…"
      options={
        <OptionsBar>
          <NumberInput label="Layers to peel (1–5)" value={depth} onChange={setDepth} min={1} max={5} step={1} />
        </OptionsBar>
      }
      modes={[{ id: 'magic', label: 'Detect', run: (s) => magicReport(s, { maxDepth: depth }), filename: 'decoded.txt' }]}
    />
  );
}
