import { Cron } from 'croner';
import cronstrue from 'cronstrue';
import { ToolError } from '@/core/types';
import { formatInZone, isoWithOffset, localZone, validZone } from '../_lib/dates';

export type CronDialect = 'unix' | 'k8s' | 'spring' | 'quartz' | 'aws';

export const DIALECTS: ReadonlyArray<{ value: CronDialect; label: string; fields: string[]; hint: string }> = [
  { value: 'unix', label: 'Unix / Linux crontab (5 fields)', fields: ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'], hint: 'minute hour day-of-month month day-of-week; Sunday is 0 or 7' },
  { value: 'k8s', label: 'Kubernetes CronJob (5 fields)', fields: ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'], hint: 'Same as Unix cron, plus @hourly, @daily and friends' },
  { value: 'spring', label: 'Spring @Scheduled (6 fields)', fields: ['Second', 'Minute', 'Hour', 'Day of month', 'Month', 'Day of week'], hint: 'second minute hour day-of-month month day-of-week' },
  { value: 'quartz', label: 'Quartz (6 or 7 fields)', fields: ['Second', 'Minute', 'Hour', 'Day of month', 'Month', 'Day of week', 'Year'], hint: 'second minute hour day-of-month month day-of-week [year]; use ? in day-of-month or day-of-week; Sunday is 1' },
  { value: 'aws', label: 'AWS EventBridge (6 fields)', fields: ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week', 'Year'], hint: 'minute hour day-of-month month day-of-week year; use ? in day-of-month or day-of-week; Sunday is 1' },
];

export interface Preset {
  label: string;
  unix: string;
  spring: string;
  quartz: string;
  aws: string;
}

export const PRESETS: Preset[] = [
  { label: 'Every minute', unix: '* * * * *', spring: '0 * * * * *', quartz: '0 * * * * ?', aws: '* * * * ? *' },
  { label: 'Every 5 minutes', unix: '*/5 * * * *', spring: '0 */5 * * * *', quartz: '0 0/5 * * * ?', aws: '0/5 * * * ? *' },
  { label: 'Every hour', unix: '0 * * * *', spring: '0 0 * * * *', quartz: '0 0 * * * ?', aws: '0 * * * ? *' },
  { label: 'Every day at 09:00', unix: '0 9 * * *', spring: '0 0 9 * * *', quartz: '0 0 9 * * ?', aws: '0 9 * * ? *' },
  { label: 'Weekdays at 09:00', unix: '0 9 * * MON-FRI', spring: '0 0 9 * * MON-FRI', quartz: '0 0 9 ? * MON-FRI', aws: '0 9 ? * MON-FRI *' },
  { label: 'Every Monday at 08:30', unix: '30 8 * * MON', spring: '0 30 8 * * MON', quartz: '0 30 8 ? * MON', aws: '30 8 ? * MON *' },
  { label: 'First day of the month at midnight', unix: '0 0 1 * *', spring: '0 0 0 1 * *', quartz: '0 0 0 1 * ?', aws: '0 0 1 * ? *' },
  { label: 'Every January 1st at midnight', unix: '0 0 1 1 *', spring: '0 0 0 1 1 *', quartz: '0 0 0 1 1 ?', aws: '0 0 1 1 ? *' },
];

export function presetFor(p: Preset, dialect: CronDialect): string {
  return dialect === 'k8s' ? p.unix : p[dialect];
}

export interface CronResult {
  description: string;
  runs: Date[];
  zone: string;
  notes: string[];
}

const NICKNAMES: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

/** Quartz and AWS number weekdays 1-7 starting on Sunday; standard cron uses 0-6. */
export function shiftWeekdays(field: string): string {
  const shift = (n: string) => (/^\d+$/.test(n) ? String((Number(n) + 6) % 7) : n);
  return field
    .split(',')
    .map((item) => {
      const [base = '', step] = item.split('/');
      const [range = '', nth] = base.split('#');
      const shiftedRange = range
        .split('-')
        .map((part) => {
          const m = /^(\d+)(L?)$/.exec(part);
          return m ? shift(m[1]!) + m[2] : part;
        })
        .join('-');
      return shiftedRange + (nth !== undefined ? '#' + nth : '') + (step !== undefined ? '/' + step : '');
    })
    .join(',');
}

const FIELD_MAX = [59, 59, 23, 31, 12, 6];

/** Quartz-style "5/15" (start at 5, every 15) becomes the range form "5-59/15" that croner understands. */
export function expandStepStarts(fields: string[]): string[] {
  return fields.map((f, i) => {
    const max = FIELD_MAX[i + (fields.length === 5 ? 1 : 0)];
    if (max === undefined) return f;
    return f
      .split(',')
      .map((item) => item.replace(/^(\d+)\/(\d+)$/, (_all, start: string, step: string) => start + '-' + max + '/' + step))
      .join(',');
  });
}

function yearMatches(field: string, year: number): boolean {
  if (field === '*' || field === '?') return true;
  return field.split(',').some((item) => {
    const [base = '', step] = item.split('/');
    const stepN = step ? Number(step) : 1;
    if (base === '*') return stepN > 0 && year % stepN === 0;
    const [a, b] = base.split('-').map(Number);
    if (b === undefined) return a === year || (step !== undefined && a! <= year && (year - a!) % stepN === 0);
    return year >= a! && year <= b && (year - a!) % stepN === 0;
  });
}

function expectedFields(d: CronDialect): number[] {
  return d === 'unix' || d === 'k8s' ? [5] : d === 'quartz' ? [6, 7] : [6];
}

export function analyzeCron(input: string, o: { dialect: CronDialect; zone: string; count: number; use24h: boolean }, from: Date = new Date()): CronResult {
  let expr = input.trim().replace(/\s+/g, ' ');
  if (!expr) throw new ToolError('Enter a cron expression such as */5 * * * *.');
  const notes: string[] = [];
  const zone = validZone(o.zone) || localZone();
  const dialect = DIALECTS.find((d) => d.value === o.dialect)!;
  if (expr.startsWith('@')) {
    const nick = NICKNAMES[expr.toLowerCase()];
    if (!nick) throw new ToolError(`${expr} is not a known shortcut. Use @yearly, @monthly, @weekly, @daily or @hourly.`);
    if (o.dialect !== 'unix' && o.dialect !== 'k8s') throw new ToolError(`Shortcuts like ${expr} work in Unix and Kubernetes cron, not in ${dialect.label.split(' (')[0]}.`);
    notes.push(`${expr} means ${nick}`);
    expr = nick;
  }
  const parts = expr.split(' ');
  const allowed = expectedFields(o.dialect);
  if (!allowed.includes(parts.length)) {
    const guess = parts.length === 5 ? 'Unix cron' : parts.length === 7 ? 'Quartz' : parts.length === 6 ? 'Spring, Quartz or AWS' : null;
    throw new ToolError(
      `${dialect.label.split(' (')[0]} cron has ${allowed.join(' or ')} fields (${dialect.hint}), but this has ${parts.length}.` + (guess ? ` It looks like ${guess}: try changing the dialect.` : ''),
    );
  }

  // Normalise to what croner and cronstrue understand.
  let cronerPattern: string;
  let describePattern: string;
  let yearField = '*';
  let legacyMode = true;
  let weekdayFromZero = true;
  if (o.dialect === 'unix' || o.dialect === 'k8s') {
    cronerPattern = expandStepStarts(parts).join(' ');
    describePattern = parts.join(' ');
  } else if (o.dialect === 'spring') {
    cronerPattern = expandStepStarts(parts).join(' ');
    describePattern = parts.join(' ');
    legacyMode = false;
  } else if (o.dialect === 'quartz') {
    const [s, mi, h, dom, mon, dow, year] = parts as [string, string, string, string, string, string, string | undefined];
    yearField = year ?? '*';
    cronerPattern = expandStepStarts([s, mi, h, dom, mon, shiftWeekdays(dow)]).join(' ');
    describePattern = parts.join(' ');
    legacyMode = false;
    weekdayFromZero = false;
  } else {
    const [mi, h, dom, mon, dow, year] = parts as [string, string, string, string, string, string];
    yearField = year;
    cronerPattern = expandStepStarts(['0', mi, h, dom, mon, shiftWeekdays(dow)]).join(' ');
    describePattern = ['0', mi, h, dom, mon, dow, year].join(' ');
    legacyMode = false;
    weekdayFromZero = false;
  }

  let description: string;
  try {
    description = cronstrue.toString(describePattern, { use24HourTimeFormat: o.use24h, dayOfWeekStartIndexZero: weekdayFromZero, throwExceptionOnParseError: true });
  } catch (e) {
    throw new ToolError(`Invalid cron expression: ${typeof e === 'string' ? e : e instanceof Error ? e.message : 'could not be read'}`);
  }

  let cron: Cron;
  try {
    cron = new Cron(cronerPattern, { timezone: zone, legacyMode });
  } catch (e) {
    throw new ToolError(`Invalid cron expression: ${e instanceof Error ? e.message : String(e)}`);
  }
  const count = Math.max(1, Math.min(50, Math.floor(o.count) || 10));
  const runs: Date[] = [];
  let cursor: Date | null = from;
  for (let i = 0; i < 20_000 && runs.length < count; i++) {
    cursor = cron.nextRun(cursor);
    if (!cursor) break;
    if (yearMatches(yearField, Number(isoWithOffset(cursor, zone).slice(0, 4)))) runs.push(cursor);
    else if (Number(isoWithOffset(cursor, zone).slice(0, 4)) > 9999) break;
  }
  if (runs.length === 0) notes.push('This expression never fires in the near future.');
  return { description, runs, zone, notes };
}

export function cronReport(input: string, o: { dialect: CronDialect; zone: string; count: number; use24h: boolean }, from?: Date): string {
  const r = analyzeCron(input, o, from);
  const lines = [r.description, ''];
  for (const n of r.notes) lines.push(n);
  if (r.runs.length) {
    lines.push(`Next ${r.runs.length} runs (${r.zone}):`);
    r.runs.forEach((d, i) => lines.push(`${String(i + 1).padStart(2)}. ${formatInZone(d, r.zone)}   ${d.toISOString()}`));
  }
  return lines.join('\n');
}
