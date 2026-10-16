import { useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import type { ToolProps } from '@/core/types';
import { Button, CopyButton, PaneTitle } from '@/ui';
import { addLap, bestWorst, formatStopwatch, lapsToText, type Lap } from './logic';

export default function Stopwatch(_props: ToolProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const base = useRef(0); // elapsed ms accumulated before the current run
  const startedAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    startedAt.current = performance.now();
    let frame = 0;
    const tick = () => {
      setElapsed(base.current + performance.now() - startedAt.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      base.current += performance.now() - startedAt.current;
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    base.current = 0;
    setElapsed(0);
    setLaps([]);
  };
  const lap = () => setLaps((l) => addLap(l, base.current + (running ? performance.now() - startedAt.current : 0)));
  const bw = bestWorst(laps);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="font-mono text-5xl tabular-nums sm:text-6xl" role="timer" aria-label="Elapsed time" data-testid="tool-output">
          {formatStopwatch(elapsed)}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" size="default" onClick={() => setRunning((r) => !r)} testId="stopwatch-toggle">
          {running ? <Pause /> : <Play />}
          {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
        </Button>
        <Button size="default" onClick={lap} disabled={!running && elapsed === 0} testId="stopwatch-lap">
          <Flag />
          Lap
        </Button>
        <Button size="default" variant="ghost" onClick={reset} disabled={elapsed === 0 && !running} testId="stopwatch-reset">
          <RotateCcw />
          Reset
        </Button>
      </div>
      {laps.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaneTitle>Laps</PaneTitle>
            <span className="flex-1" />
            <CopyButton text={lapsToText(laps)} label="Copy laps" />
          </div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm" data-testid="stopwatch-laps">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-2 font-normal">Lap</th>
                  <th className="px-3 py-2 font-normal">Split</th>
                  <th className="px-3 py-2 font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[...laps].reverse().map((l) => (
                  <tr key={l.n} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {l.n}
                      {bw && bw.best === l.n - 1 && <span className="ml-2 text-xs text-brand">fastest</span>}
                      {bw && bw.worst === l.n - 1 && <span className="ml-2 text-xs text-muted-foreground">slowest</span>}
                    </td>
                    <td className="px-3 py-2">{formatStopwatch(l.split)}</td>
                    <td className="px-3 py-2">{formatStopwatch(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
