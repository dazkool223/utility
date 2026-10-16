import { formatInZone, isoWithOffset, localZone, parseMoment, relativeFromNow, toDate, UNIT_NAMES, validZone, type Unit } from '../_lib/dates';

export interface TimestampOptions {
  zone: string;
  force: Unit | 'auto';
}

function pad(label: string): string {
  return (label + ':').padEnd(13);
}

function describe(token: string, o: TimestampOptions, now: number): string {
  const zone = validZone(o.zone) || localZone();
  const m = parseMoment(token, now, o.force, validZone(o.zone));
  const d = toDate(m.ms);
  const sec = Math.floor(m.ms / 1000);
  const rows: Array<[string, string]> = [
    ['Understood as', m.unit ? `${UNIT_NAMES[m.unit]} (${m.source.includes('since') ? 'Unix time' : m.source})` : m.source],
    ['UTC', formatInZone(d, 'UTC')],
    ['ISO 8601', d.toISOString()],
    [zone, formatInZone(d, zone)],
    ['ISO in zone', isoWithOffset(d, zone)],
    ['Relative', relativeFromNow(m.ms, now)],
    ['Unix seconds', String(sec)],
    ['Unix ms', String(Math.floor(m.ms))],
  ];
  return rows.map(([k, v]) => `${pad(k)} ${v}`).join('\n');
}

/** Convert each line: a Unix timestamp (s, ms, µs or ns, auto-detected) or a date becomes every common representation. */
export function convertTimestamps(input: string, o: TimestampOptions, now: number = Date.now()): string {
  const lines = input.split('\n').filter((l) => l.trim());
  return lines.map((l) => (lines.length > 1 ? `${l.trim()}\n${'-'.repeat(Math.min(l.trim().length, 40))}\n` : '') + describe(l, o, now)).join('\n\n');
}

export function timestampToIso(input: string, now: number = Date.now()): string {
  return input
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => toDate(parseMoment(l, now).ms).toISOString())
    .join('\n');
}

export function dateToUnixSeconds(input: string, now: number = Date.now()): string {
  return input
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => String(Math.floor(parseMoment(l, now).ms / 1000)))
    .join('\n');
}
