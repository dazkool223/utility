import { ToolError } from '@/core/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86_400_000;

export interface DayInfo {
  date: string;
  weekday: string;
  isoWeek: number;
  isoYear: number;
  /** Week number counting weeks that start on Sunday, with week 1 containing 1 January (US style). */
  usWeek: number;
  dayOfYear: number;
  daysInYear: number;
  daysLeft: number;
  quarter: number;
  weekStart: string;
  weekEnd: string;
  leapYear: boolean;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const iso = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Calendar maths on a plain date (no time zone involved). */
export function dayInfo(year: number, month: number, day: number): DayInfo {
  const probe = new Date(Date.UTC(2000, month - 1, day));
  probe.setUTCFullYear(year);
  if (month < 1 || month > 12 || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new ToolError(`${pad(year, 4)}-${pad(month)}-${pad(day)} is not a real date.`);
  }
  const ms = probe.getTime();
  const jan1 = Date.UTC(2000, 0, 1);
  const startOfYear = new Date(jan1);
  startOfYear.setUTCFullYear(year);
  const dayOfYear = Math.round((ms - startOfYear.getTime()) / DAY_MS) + 1;
  const daysInYear = isLeap(year) ? 366 : 365;
  const dow = probe.getUTCDay();
  const isoDow = dow === 0 ? 7 : dow;
  // ISO week: the week belongs to the year of its Thursday.
  const thursday = ms + (4 - isoDow) * DAY_MS;
  const thu = new Date(thursday);
  const isoYear = thu.getUTCFullYear();
  const thuStart = new Date(jan1);
  thuStart.setUTCFullYear(isoYear);
  const isoWeek = Math.floor((thursday - thuStart.getTime()) / DAY_MS / 7) + 1;
  const jan1Dow = startOfYear.getUTCDay();
  const usWeek = Math.floor((dayOfYear - 1 + jan1Dow) / 7) + 1;
  const monday = ms - (isoDow - 1) * DAY_MS;
  return {
    date: iso(ms),
    weekday: DAYS[dow]!,
    isoWeek,
    isoYear,
    usWeek,
    dayOfYear,
    daysInYear,
    daysLeft: daysInYear - dayOfYear,
    quarter: Math.floor((month - 1) / 3) + 1,
    weekStart: iso(monday),
    weekEnd: iso(monday + 6 * DAY_MS),
    leapYear: isLeap(year),
  };
}

function parseLine(line: string, today: Date): DayInfo {
  const t = line.trim();
  if (/^(now|today)$/i.test(t)) return dayInfo(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(t);
  if (m) return dayInfo(+m[1]!, +m[2]!, +m[3]!);
  const week = /^(\d{4})-?W(\d{1,2})(?:-?([1-7]))?$/i.exec(t);
  if (week) return fromIsoWeek(+week[1]!, +week[2]!, week[3] ? +week[3] : 1);
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) throw new ToolError(`Could not read "${t.length > 50 ? t.slice(0, 50) + '…' : t}" as a date. Try 2024-05-31, 2024-W22 or today.`);
  const d = new Date(ms);
  return dayInfo(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** The date of a given ISO week and weekday (1 = Monday). */
export function fromIsoWeek(year: number, week: number, weekday = 1): DayInfo {
  if (week < 1 || week > 53) throw new ToolError(`ISO week ${week} does not exist. Weeks run from 1 to 53.`);
  const jan4 = new Date(Date.UTC(2000, 0, 4));
  jan4.setUTCFullYear(year);
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Monday = jan4.getTime() - (jan4Dow - 1) * DAY_MS;
  const d = new Date(week1Monday + ((week - 1) * 7 + (weekday - 1)) * DAY_MS);
  const info = dayInfo(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  if (info.isoYear !== year) throw new ToolError(`${year} has no ISO week ${week}.`);
  return info;
}

export function describeDay(i: DayInfo): string {
  return [
    `${i.date} (${i.weekday})`,
    `ISO week: ${i.isoYear}-W${pad(i.isoWeek)} (week ${i.isoWeek} of ISO year ${i.isoYear})`,
    `US week (Sunday start): ${i.usWeek}`,
    `Day of year: ${i.dayOfYear} of ${i.daysInYear} (${i.daysLeft} days left)`,
    `Quarter: Q${i.quarter}`,
    `Week runs: ${i.weekStart} (Mon) to ${i.weekEnd} (Sun)`,
    `Leap year: ${i.leapYear ? 'yes' : 'no'}`,
  ].join('\n');
}

/** One date per line, blank lines skipped. Accepts YYYY-MM-DD, YYYY-Www[-d], "today" or anything Date can parse. */
export function weekNumbers(input: string, today: Date = new Date()): string {
  const lines = input.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) throw new ToolError('Enter a date such as 2024-05-31, or the word today.');
  return lines.map((l) => describeDay(parseLine(l, today))).join('\n\n');
}

/** Only the ISO week label for each line, e.g. 2024-W22. Used by the Pipeline. */
export function isoWeekLabels(input: string, today: Date = new Date()): string {
  return input
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      const i = parseLine(l, today);
      return `${i.isoYear}-W${pad(i.isoWeek)}`;
    })
    .join('\n');
}
