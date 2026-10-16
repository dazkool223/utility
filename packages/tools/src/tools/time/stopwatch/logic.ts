/** Format milliseconds as HH:MM:SS.mmm (hours omitted when zero). */
export function formatStopwatch(ms: number): string {
  const t = Math.max(0, Math.floor(ms));
  const h = Math.floor(t / 3_600_000);
  const m = Math.floor((t % 3_600_000) / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  const milli = t % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${h ? p(h) + ':' : ''}${p(m)}:${p(s)}.${p(milli, 3)}`;
}

export interface Lap {
  n: number;
  /** Elapsed at the moment of the lap. */
  total: number;
  /** Time since the previous lap. */
  split: number;
}

export function addLap(laps: readonly Lap[], elapsed: number): Lap[] {
  const prev = laps.length ? laps[laps.length - 1]!.total : 0;
  return [...laps, { n: laps.length + 1, total: elapsed, split: Math.max(0, elapsed - prev) }];
}

export function lapsToText(laps: readonly Lap[]): string {
  return laps.map((l) => `Lap ${l.n}\t${formatStopwatch(l.split)}\t${formatStopwatch(l.total)}`).join('\n');
}

/** Index of the fastest and slowest lap, or null with fewer than two laps. */
export function bestWorst(laps: readonly Lap[]): { best: number; worst: number } | null {
  if (laps.length < 2) return null;
  let best = 0;
  let worst = 0;
  laps.forEach((l, i) => {
    if (l.split < laps[best]!.split) best = i;
    if (l.split > laps[worst]!.split) worst = i;
  });
  return { best, worst };
}
