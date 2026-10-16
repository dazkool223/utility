import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, NumberInput, OptionsBar, TextTransform } from '@/ui';
import { buildBenchmark, DEFAULT_BENCH, type BenchOptions } from './logic';

export default function JsBenchmark({ initialInput }: ToolProps) {
  const [o, setO] = useState<BenchOptions>(DEFAULT_BENCH);
  const set = <K extends keyof BenchOptions>(k: K) => (v: BenchOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(
    () => [{ id: 'build', label: 'Build', run: (s: string) => buildBenchmark(s, o), inputLanguage: 'javascript' as const, outputLanguage: 'javascript' as const, filename: 'bench.mjs' }],
    [o],
  );
  return (
    <div className="flex flex-col gap-3">
      <TextTransform
        modes={modes}
        initialInput={initialInput}
        inputPlaceholder={'// setup\nconst data = [1, 2, 3];\n// ---\n// name: first idea\ndata.map((x) => x * 2)\n// ---\n// name: second idea\ndata.flatMap((x) => [x * 2])'}
        options={
          <OptionsBar>
            <NumberInput label="Measure each case (ms)" value={o.timeMs} onChange={set('timeMs')} min={50} max={60000} step={100} />
            <NumberInput label="Warm-up (ms)" value={o.warmupMs} onChange={set('warmupMs')} min={0} max={10000} step={50} />
            <Checkbox label="Snippets use await" checked={o.async} onChange={set('async')} />
          </OptionsBar>
        }
      />
      <p className="m-0 text-xs text-muted-foreground">
        Separate snippets with a <code>// ---</code> line. Start with <code>// setup</code> for code that runs once, and <code>// name: …</code> to label a case. A one-line snippet without a semicolon is treated as an
        expression and its value is returned.
      </p>
    </div>
  );
}
