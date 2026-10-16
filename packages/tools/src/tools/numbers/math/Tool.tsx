import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { NumberInput, OptionsBar, Select, TextTransform, useWorker, type TransformMode } from '@/ui';
import type { NumberKind } from './logic';

export default function MathTool({ initialInput }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }), { timeoutMs: 10_000 });
  const [kind, setKind] = useState<NumberKind>('number');
  const [precision, setPrecision] = useState(14);
  const modes = useMemo<TransformMode[]>(() => [{ id: 'eval', label: 'Evaluate', run: (s) => api().evaluate(s, kind, precision), filename: 'results.txt' }], [api, kind, precision]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      inputPlaceholder={'One expression per line. Variables carry over.\nx = 5 inch to cm\nsqrt(x^2 + 1)\n# comments start with #'}
      options={
        <OptionsBar>
          <Select
            label="Numbers"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'number', label: 'Standard (64-bit float)' },
              { value: 'BigNumber', label: 'BigNumber (arbitrary precision)' },
              { value: 'Fraction', label: 'Fractions (exact)' },
            ]}
          />
          <NumberInput label="Significant digits" value={precision} onChange={setPrecision} min={1} max={64} />
        </OptionsBar>
      }
    />
  );
}
