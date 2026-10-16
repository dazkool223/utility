import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, CopyButton, ErrorBox, KeyValueTable, NumberInput, OptionsBar, PaneTitle, TextInput } from '@/ui';
import { computeEta, formatDuration, parseDuration } from './logic';

export default function EtaCalculator(_props: ToolProps) {
  const [done, setDone] = useState(250);
  const [total, setTotal] = useState(1000);
  const [elapsed, setElapsed] = useState('10m');
  const [now, setNow] = useState(() => Date.now());
  const result = useMemo(() => {
    try {
      return { eta: computeEta(done, total, parseDuration(elapsed), now), error: null as string | null };
    } catch (e) {
      return { eta: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [done, total, elapsed, now]);
  const eta = result.eta;
  const rows: Array<[string, string]> = eta
    ? [
        ['Progress', `${eta.percent.toFixed(1)}%`],
        ['Time remaining', formatDuration(eta.remainingSeconds)],
        ['Estimated total time', formatDuration(eta.totalSeconds)],
        ['Finishes at', new Date(eta.finishAt).toLocaleString()],
        ['Rate', `${eta.ratePerMinute.toFixed(2)} per minute (${eta.ratePerHour.toFixed(1)} per hour)`],
      ]
    : [];
  return (
    <div className="flex flex-col gap-3">
      <OptionsBar>
        <NumberInput label="Items done" value={done} onChange={setDone} min={0} />
        <NumberInput label="Total items" value={total} onChange={setTotal} min={1} />
        <TextInput label="Time elapsed (12:30, 1h 30m, 90)" value={elapsed} onChange={setElapsed} testId="eta-elapsed" monospace />
        <Button variant="ghost" onClick={() => setNow(Date.now())} title="Use the current time as the starting point">
          Update clock
        </Button>
      </OptionsBar>
      <ErrorBox error={result.error} />
      {eta && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaneTitle>Estimate</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={rows.map(([k, v]) => `${k}: ${v}`).join('\n')} />
          </div>
          <KeyValueTable rows={rows} />
        </section>
      )}
    </div>
  );
}
