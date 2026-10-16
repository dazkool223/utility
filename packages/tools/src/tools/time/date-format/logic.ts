import { format, getDayOfYear, getISOWeek, getISOWeekYear, getQuarter, parse as parseWith } from 'date-fns';
import { ToolError } from '@/core/types';
import { formatInZone, isoWithOffset, localZone, parseMoment, toDate, validZone, wallToInstant, zoneOffsetMs } from '../_lib/dates';

export interface DateFormatOptions {
  zone: string;
  /** date-fns pattern describing the input, for example dd/MM/yyyy HH:mm. Empty = detect. */
  inputPattern: string;
  /** date-fns pattern for an extra custom output line. */
  outputPattern: string;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** A Date whose local fields show the wall-clock time of `d` in `zone`, so date-fns can format it. */
export function wallClockDate(d: Date, zone: string): Date {
  const off = zoneOffsetMs(d.getTime(), zone);
  const w = new Date(d.getTime() + off);
  return new Date(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes(), w.getUTCSeconds(), w.getUTCMilliseconds());
}

function rfc2822(d: Date, zone: string): string {
  const w = wallClockDate(d, zone);
  const off = Math.round(zoneOffsetMs(d.getTime(), zone) / 60_000);
  const sign = off < 0 ? '-' : '+';
  const a = Math.abs(off);
  return `${format(w, 'EEE, dd MMM yyyy HH:mm:ss')} ${sign}${pad(Math.floor(a / 60))}${pad(a % 60)}`;
}

export function parseInput(input: string, o: DateFormatOptions, now: number): number {
  const zone = validZone(o.zone) || localZone();
  if (o.inputPattern.trim()) {
    let parsed: Date;
    try {
      parsed = parseWith(input.trim(), o.inputPattern.trim(), new Date(now));
    } catch (e) {
      throw new ToolError(`The input format "${o.inputPattern}" is not valid: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (Number.isNaN(parsed.getTime())) throw new ToolError(`"${input.trim()}" does not match the input format ${o.inputPattern}.`);
    return wallToInstant(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate(), parsed.getHours(), parsed.getMinutes(), parsed.getSeconds(), parsed.getMilliseconds(), zone);
  }
  return parseMoment(input, now, 'auto', validZone(o.zone)).ms;
}

export function formatDates(input: string, o: DateFormatOptions, now: number = Date.now()): string {
  const zone = validZone(o.zone) || localZone();
  const lines = input.split('\n').filter((l) => l.trim());
  return lines
    .map((line) => {
      const ms = parseInput(line, o, now);
      const d = toDate(ms);
      const w = wallClockDate(d, zone);
      const rows: Array<[string, string]> = [
        ['ISO 8601 (UTC)', d.toISOString()],
        [`ISO 8601 (${zone})`, isoWithOffset(d, zone)],
        ['RFC 2822', rfc2822(d, zone)],
        ['HTTP date', d.toUTCString()],
        ['SQL datetime', format(w, 'yyyy-MM-dd HH:mm:ss')],
        ['Date only', format(w, 'yyyy-MM-dd')],
        ['Time only', format(w, 'HH:mm:ss')],
        ['US', format(w, 'MM/dd/yyyy h:mm a')],
        ['European', format(w, 'dd/MM/yyyy HH:mm')],
        ['Long', formatInZone(d, zone, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: undefined, timeZoneName: 'short', hourCycle: undefined })],
        ['Unix seconds', String(Math.floor(ms / 1000))],
        ['Unix milliseconds', String(Math.floor(ms))],
        ['Day of year', String(getDayOfYear(w))],
        ['ISO week', `${getISOWeekYear(w)}-W${pad(getISOWeek(w))}`],
        ['Quarter', `Q${getQuarter(w)}`],
      ];
      if (o.outputPattern.trim()) {
        let custom: string;
        try {
          custom = format(w, o.outputPattern.trim());
        } catch (e) {
          throw new ToolError(`The output format "${o.outputPattern}" is not valid: ${e instanceof Error ? e.message : String(e)}`);
        }
        rows.push([`Custom (${o.outputPattern.trim()})`, custom]);
      }
      const width = Math.max(...rows.map(([k]) => k.length)) + 2;
      return (lines.length > 1 ? line.trim() + '\n' : '') + rows.map(([k, v]) => `${(k + ':').padEnd(width)}${v}`).join('\n');
    })
    .join('\n\n');
}

export const PATTERN_HELP = 'yyyy year, MM month, dd day, HH 24-hour, hh 12-hour, mm minutes, ss seconds, SSS milliseconds, a AM/PM, EEE weekday, MMM month name';
