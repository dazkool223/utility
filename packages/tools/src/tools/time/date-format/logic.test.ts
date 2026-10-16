import { describe, expect, it } from 'vitest';
import { formatDates, wallClockDate } from './logic';

const NOW = Date.UTC(2024, 0, 1);
const o = { zone: 'UTC', inputPattern: '', outputPattern: '' };

describe('formatDates', () => {
  it('shows an ISO date in many formats', () => {
    const out = formatDates('2024-05-31T14:30:15Z', o, NOW);
    expect(out).toContain('ISO 8601 (UTC):');
    expect(out).toContain('2024-05-31T14:30:15.000Z');
    expect(out).toContain('RFC 2822:');
    expect(out).toContain('Fri, 31 May 2024 14:30:15 +0000');
    expect(out).toContain('Fri, 31 May 2024 14:30:15 GMT');
    expect(out).toContain('2024-05-31 14:30:15');
    expect(out).toContain('05/31/2024 2:30 PM');
    expect(out).toContain('31/05/2024 14:30');
    expect(out).toContain('1717165815');
    expect(out).toContain('Day of year:');
    expect(out).toContain('152');
    expect(out).toContain('2024-W22');
    expect(out).toContain('Q2');
  });
  it('accepts Unix timestamps and shifts into a zone', () => {
    const out = formatDates('1717165815', { ...o, zone: 'America/New_York' }, NOW);
    expect(out).toContain('2024-05-31T10:30:15.000-04:00');
    expect(out).toContain('Fri, 31 May 2024 10:30:15 -0400');
    expect(out).toContain('2024-05-31 10:30:15');
  });
  it('parses a custom input format', () => {
    const out = formatDates('31/12/2023 23:59', { ...o, inputPattern: 'dd/MM/yyyy HH:mm' }, NOW);
    expect(out).toContain('2023-12-31T23:59:00.000Z');
  });
  it('applies the zone to a custom input format', () => {
    const out = formatDates('01/06/2024 09:00', { ...o, zone: 'Asia/Kolkata', inputPattern: 'dd/MM/yyyy HH:mm' }, NOW);
    expect(out).toContain('2024-06-01T03:30:00.000Z');
  });
  it('renders a custom output pattern', () => {
    expect(formatDates('2024-05-31T14:30:15Z', { ...o, outputPattern: "EEEE, d MMMM yyyy 'at' HH:mm" }, NOW)).toContain('Custom (EEEE, d MMMM yyyy \'at\' HH:mm): Friday, 31 May 2024 at 14:30');
  });
  it('handles several lines', () => {
    expect(formatDates('2024-01-01\n2024-01-02', o, NOW).split('\n\n')).toHaveLength(2);
  });
  it('reports bad input and bad patterns', () => {
    expect(() => formatDates('nonsense', o, NOW)).toThrow(/Could not read/);
    expect(() => formatDates('12-12-2024', { ...o, inputPattern: 'yyyy/MM/dd' }, NOW)).toThrow(/does not match the input format/);
    expect(() => formatDates('2024-01-01', { ...o, outputPattern: 'YYYY' }, NOW)).toThrow(/output format/);
    expect(() => formatDates('2024-01-01', { ...o, zone: 'Nope/Nope' }, NOW)).toThrow(/time zone/);
  });
  it('handles leap days, year boundaries and a large list', () => {
    expect(formatDates('2024-02-29T12:00:00Z', o, NOW)).toContain('Day of year:');
    expect(formatDates('2023-01-01T00:00:00Z', o, NOW)).toContain('2022-W52');
    const many = Array.from({ length: 3000 }, (_, i) => `2024-01-01T00:00:${pad(i % 60)}Z`).join('\n');
    expect(formatDates(many, o, NOW).split('\n\n')).toHaveLength(3000);
  });
});

function pad(n: number) {
  return String(n).padStart(2, '0');
}

describe('wallClockDate', () => {
  it('shows zone wall time in local fields', () => {
    const w = wallClockDate(new Date(Date.UTC(2024, 0, 1, 0, 0)), 'Asia/Tokyo');
    expect([w.getFullYear(), w.getMonth(), w.getDate(), w.getHours()]).toEqual([2024, 0, 1, 9]);
  });
});
