import { ToolError } from '@/core/types';

/** Reads "90", "1:30", "01:30:00", "1h 30m", "2d 3h 4m 5s", "1.5h" into seconds. */
export function parseDuration(input: string): number {
  const t = input.trim().toLowerCase();
  if (!t) throw new ToolError('Enter how long it has taken, for example 12:30, 1h 30m or 90 (seconds).');
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^\d+(:\d{1,2}){1,2}(\.\d+)?$/.test(t)) {
    const parts = t.split(':').map(Number);
    const [h, m, s] = parts.length === 3 ? parts : [0, parts[0]!, parts[1]!];
    if (m! > 59 || s! >= 60) throw new ToolError(`"${input.trim()}" has minutes or seconds above 59.`);
    return h! * 3600 + m! * 60 + s!;
  }
  const unit = /(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g;
  const mult: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };
  let total = 0;
  const rest = t.replace(unit, (_all, n: string, u: string) => {
    total += Number(n) * mult[u[0]!]!;
    return '';
  });
  if (rest.replace(/[\s,]|and/g, '') !== '' || total === 0 && !/[1-9]/.test(t)) throw new ToolError(`Could not read "${input.trim()}" as a duration. Try 12:30, 1h 30m or 90.`);
  return total;
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return 'unknown';
  let s = Math.round(totalSeconds);
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const parts = [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean);
  return parts.join(' ');
}

export interface EtaResult {
  percent: number;
  ratePerSecond: number;
  ratePerMinute: number;
  ratePerHour: number;
  remainingSeconds: number;
  totalSeconds: number;
  finishAt: number;
}

export function computeEta(done: number, total: number, elapsedSeconds: number, now: number): EtaResult {
  if (!Number.isFinite(done) || !Number.isFinite(total) || !Number.isFinite(elapsedSeconds)) throw new ToolError('Enter numbers for items done, total items and time elapsed.');
  if (total <= 0) throw new ToolError('The total must be greater than zero.');
  if (done < 0) throw new ToolError('Items done cannot be negative.');
  if (done > total) throw new ToolError('Items done cannot be more than the total.');
  if (elapsedSeconds <= 0) throw new ToolError('Time elapsed must be greater than zero.');
  if (done === 0) throw new ToolError('Nothing is done yet, so there is no rate to estimate from. Enter at least one finished item.');
  const rate = done / elapsedSeconds;
  const remaining = (total - done) / rate;
  return {
    percent: (done / total) * 100,
    ratePerSecond: rate,
    ratePerMinute: rate * 60,
    ratePerHour: rate * 3600,
    remainingSeconds: remaining,
    totalSeconds: elapsedSeconds + remaining,
    finishAt: now + remaining * 1000,
  };
}
