import { ToolError } from '@/core/types';

export type Unit = 's' | 'ms' | 'us' | 'ns';
export const UNIT_NAMES: Record<Unit, string> = { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' };

/** Largest absolute values read as seconds, milliseconds and microseconds when the unit is auto-detected. */
const LIMITS: Array<[Unit, bigint]> = [
  ['s', 100_000_000_000n],
  ['ms', 100_000_000_000_000n],
  ['us', 100_000_000_000_000_000n],
];

export interface ParsedMoment {
  /** Milliseconds since the Unix epoch (may be fractional). */
  ms: number;
  unit: Unit | null;
  /** How the input was understood, for display. */
  source: string;
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

/** Intl.DateTimeFormat is slow to construct, so reuse instances. */
export function dtf(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    dtfCache.set(key, f);
  }
  return f;
}

export function validZone(zone: string): string {
  const z = zone.trim();
  if (!z) return z;
  try {
    dtf('en', { timeZone: z });
    return z;
  } catch {
    throw new ToolError(`"${z}" is not a known time zone. Use a name like America/New_York, Europe/London or UTC.`);
  }
}

export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** Interpret an all-digits (or digits.digits) token as a Unix timestamp. Returns null when it is not one. */
export function parseTimestamp(token: string, force: Unit | 'auto' = 'auto'): ParsedMoment | null {
  const t = token.trim();
  if (/^-?\d+$/.test(t)) {
    const big = BigInt(t);
    const abs = big < 0n ? -big : big;
    let unit: Unit = 'ns';
    if (force !== 'auto') unit = force;
    else for (const [u, limit] of LIMITS) if (abs < limit) { unit = u; break; }
    const ms = unit === 's' ? Number(big) * 1000 : unit === 'ms' ? Number(big) : unit === 'us' ? Number(big / 1000n) + Number(big % 1000n) / 1000 : Number(big / 1_000_000n) + Number(big % 1_000_000n) / 1e6;
    return { ms, unit, source: `${UNIT_NAMES[unit]} since 1970-01-01 UTC` };
  }
  if (/^-?\d+\.\d+$/.test(t)) {
    const unit: Unit = force === 'auto' ? 's' : force;
    const n = Number(t);
    const ms = unit === 's' ? n * 1000 : unit === 'ms' ? n : unit === 'us' ? n / 1000 : n / 1e6;
    return { ms, unit, source: `${UNIT_NAMES[unit]} since 1970-01-01 UTC` };
  }
  return null;
}

/** Parse a timestamp, "now", or any date string the browser understands. Date-only and no-zone strings count as local time. */
/** Offset of `zone` from UTC, in milliseconds, at the instant `utcMs`. */
export function zoneOffsetMs(utcMs: number, zone: string): number {
  const parts = dtf('en-CA', {
    timeZone: zone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(utcMs / 1000) * 1000;
}

/** The instant at which the wall clock in `zone` shows the given fields. */
export function wallToInstant(y: number, mo: number, d: number, h: number, mi: number, s: number, ms: number, zone: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s, ms);
  const first = guess - zoneOffsetMs(guess, zone);
  return guess - zoneOffsetMs(first, zone);
}

const ISO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?$/;

export function parseMoment(input: string, now: number = Date.now(), force: Unit | 'auto' = 'auto', zone: string = ''): ParsedMoment {
  const t = input.trim();
  if (!t) throw new ToolError('Enter a Unix timestamp or a date.');
  if (/^now$/i.test(t)) return { ms: now, unit: null, source: 'the current time' };
  const ts = parseTimestamp(t, force);
  if (ts) return ts;
  const iso = ISO_LOCAL.exec(t);
  if (iso) {
    const [, y, mo, d, h, mi, sec, frac] = iso;
    const probe = new Date(Date.UTC(+y!, +mo! - 1, +d!));
    if (probe.getUTCMonth() !== +mo! - 1 || probe.getUTCDate() !== +d! || +(h ?? 0) > 23 || +(mi ?? 0) > 59 || +(sec ?? 0) > 59) throw new ToolError(`${t} is not a real date or time.`);
    const instant = wallToInstant(+y!, +mo!, +d!, +(h ?? 0), +(mi ?? 0), +(sec ?? 0), frac ? Math.floor(Number('0.' + frac) * 1000) : 0, zone || localZone());
    if (Number.isNaN(instant)) throw new ToolError('That is not a real date.');
    return { ms: instant, unit: null, source: 'a date string' + (zone ? ` in ${zone}` : ' in your local time zone') };
  }
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) throw new ToolError(`Could not read "${t.length > 60 ? t.slice(0, 60) + '…' : t}" as a Unix timestamp or a date. Try 1700000000, 2024-05-31 14:30 or 2024-05-31T14:30:00Z.`);
  return { ms, unit: null, source: 'a date string' };
}

export function toDate(ms: number): Date {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new ToolError('That moment is outside the range a date can represent (about 273,000 years either side of 1970).');
  return d;
}

/** "Tue, 14 Nov 2023, 22:13:20 UTC+1" style, in the given IANA zone. */
export function formatInZone(d: Date, zone: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return dtf('en-GB', {
    timeZone: zone || undefined,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
    ...opts,
  }).format(d);
}

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_557_600_000],
  ['month', 2_629_800_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
];

/** "3 days ago", "in 2 hours". */
export function relativeFromNow(ms: number, now: number = Date.now()): string {
  const diff = ms - now;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of STEPS) {
    if (Math.abs(diff) >= size) return rtf.format(Math.round(diff / size), unit);
  }
  return Math.abs(diff) < 1000 ? 'just now' : rtf.format(Math.round(diff / 1000), 'second');
}

/** ISO-8601 string with the UTC offset of `zone` (for example 2024-05-31T14:30:00+02:00). */
export function isoWithOffset(d: Date, zone: string): string {
  const parts = dtf('en-CA', {
    timeZone: zone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const wall = Date.UTC(+get('year'), +get('month') - 1, +get('day'), +get('hour'), +get('minute'), +get('second'));
  const offMin = Math.round((wall - Math.floor(d.getTime() / 1000) * 1000) / 60_000);
  const sign = offMin < 0 ? '-' : '+';
  const a = Math.abs(offMin);
  const off = offMin === 0 ? 'Z' : `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
  const ms = String(((d.getTime() % 1000) + 1000) % 1000).padStart(3, '0');
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}${off}`;
}
