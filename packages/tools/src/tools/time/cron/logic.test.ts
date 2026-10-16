import { describe, expect, it } from 'vitest';
import { analyzeCron, cronReport, PRESETS, presetFor, shiftWeekdays, DIALECTS } from './logic';

const FROM = new Date(Date.UTC(2024, 0, 1, 0, 0, 0)); // Monday
const o = { dialect: 'unix', zone: 'UTC', count: 5, use24h: false } as const;
const iso = (r: ReturnType<typeof analyzeCron>) => r.runs.map((d) => d.toISOString());

describe('Unix cron', () => {
  it('describes and schedules every 5 minutes', () => {
    const r = analyzeCron('*/5 * * * *', o, FROM);
    expect(r.description).toBe('Every 5 minutes');
    expect(iso(r)).toEqual(['2024-01-01T00:05:00.000Z', '2024-01-01T00:10:00.000Z', '2024-01-01T00:15:00.000Z', '2024-01-01T00:20:00.000Z', '2024-01-01T00:25:00.000Z']);
  });
  it('handles weekdays', () => {
    const r = analyzeCron('0 9 * * 1-5', o, FROM);
    expect(r.description).toBe('At 09:00 AM, Monday through Friday');
    expect(iso(r).slice(0, 2)).toEqual(['2024-01-01T09:00:00.000Z', '2024-01-02T09:00:00.000Z']);
    expect(iso(r)[4]).toBe('2024-01-05T09:00:00.000Z');
  });
  it('uses classic OR semantics for day-of-month and day-of-week', () => {
    expect(iso(analyzeCron('0 0 1,15 * 3', o, FROM)).slice(0, 3)).toEqual(['2024-01-03T00:00:00.000Z', '2024-01-10T00:00:00.000Z', '2024-01-15T00:00:00.000Z']);
  });
  it('supports shortcuts', () => {
    const r = analyzeCron('@daily', o, FROM);
    expect(r.notes[0]).toBe('@daily means 0 0 * * *');
    expect(iso(r)[0]).toBe('2024-01-02T00:00:00.000Z');
  });
  it('supports 24-hour descriptions', () => {
    expect(analyzeCron('30 14 * * *', { ...o, use24h: true }, FROM).description).toBe('At 14:30');
  });
  it('respects the time zone', () => {
    expect(iso(analyzeCron('0 9 * * *', { ...o, zone: 'Asia/Tokyo' }, FROM))[0]).toBe('2024-01-02T00:00:00.000Z');
    expect(iso(analyzeCron('0 9 * * *', { ...o, zone: 'America/New_York' }, FROM))[0]).toBe('2024-01-01T14:00:00.000Z');
  });
  it('finds a rare date such as Feb 29', () => {
    expect(iso(analyzeCron('0 0 29 2 *', { ...o, count: 1 }, FROM))[0]).toBe('2024-02-29T00:00:00.000Z');
  });
});

describe('other dialects', () => {
  it('Spring uses a leading seconds field', () => {
    const r = analyzeCron('0 0 9 * * MON-FRI', { ...o, dialect: 'spring' }, FROM);
    expect(r.description).toBe('At 09:00 AM, Monday through Friday');
    expect(iso(r)[0]).toBe('2024-01-01T09:00:00.000Z');
  });
  it('Quartz numbers weekdays from Sunday=1 and understands ? and #', () => {
    const r = analyzeCron('0 0 12 ? * 2#1', { ...o, dialect: 'quartz' }, FROM);
    expect(r.description).toBe('At 12:00 PM, on the first Monday of the month');
    expect(iso(r)[0]).toBe('2024-01-01T12:00:00.000Z');
    expect(iso(r)[1]).toBe('2024-02-05T12:00:00.000Z');
  });
  it('Quartz supports the last day of the month and a year field', () => {
    expect(iso(analyzeCron('0 0 0 L * ?', { ...o, dialect: 'quartz', count: 2 }, FROM))).toEqual(['2024-01-31T00:00:00.000Z', '2024-02-29T00:00:00.000Z']);
    const y = analyzeCron('0 0 12 1 1 ? 2026', { ...o, dialect: 'quartz', count: 3 }, FROM);
    expect(iso(y)).toEqual(['2026-01-01T12:00:00.000Z']);
    expect(y.description).toContain('only in 2026');
  });
  it('AWS EventBridge has no seconds and a year field', () => {
    const r = analyzeCron('0 8 ? * MON-FRI *', { ...o, dialect: 'aws' }, FROM);
    expect(r.description).toBe('At 08:00 AM, Monday through Friday');
    expect(iso(r)[0]).toBe('2024-01-01T08:00:00.000Z');
    expect(iso(analyzeCron('15 10 ? * 6L *', { ...o, dialect: 'aws', count: 1 }, FROM))[0]).toBe('2024-01-26T10:15:00.000Z');
  });
  it('Kubernetes accepts shortcuts, Quartz does not', () => {
    expect(analyzeCron('@hourly', { ...o, dialect: 'k8s' }, FROM).runs).toHaveLength(5);
    expect(() => analyzeCron('@hourly', { ...o, dialect: 'quartz' }, FROM)).toThrow(/Shortcuts/);
  });
});

describe('validation', () => {
  it('rejects empty input and the wrong number of fields with a hint', () => {
    expect(() => analyzeCron('  ', o)).toThrow(/Enter a cron expression/);
    expect(() => analyzeCron('0 0 9 * * *', o)).toThrow(/5 fields.*but this has 6.*Spring, Quartz or AWS/);
    expect(() => analyzeCron('* * * *', o)).toThrow(/but this has 4/);
  });
  it('rejects out-of-range values and unknown shortcuts', () => {
    expect(() => analyzeCron('61 * * * *', o)).toThrow(/Invalid cron expression/);
    expect(() => analyzeCron('* 25 * * *', o)).toThrow(/Invalid cron expression/);
    expect(() => analyzeCron('@sometimes', o)).toThrow(/not a known shortcut/);
    expect(() => analyzeCron('* * * * *', { ...o, zone: 'Nope/Zone' })).toThrow(/time zone/);
  });
  it('notes expressions that never fire', () => {
    expect(analyzeCron('0 0 31 2 *', o, FROM).notes).toContain('This expression never fires in the near future.');
  });
});

describe('helpers', () => {
  it('shifts Quartz weekdays', () => {
    expect(shiftWeekdays('1')).toBe('0');
    expect(shiftWeekdays('2-6')).toBe('1-5');
    expect(shiftWeekdays('2#1')).toBe('1#1');
    expect(shiftWeekdays('6L')).toBe('5L');
    expect(shiftWeekdays('MON-FRI')).toBe('MON-FRI');
    expect(shiftWeekdays('1,7')).toBe('0,6');
    expect(shiftWeekdays('*')).toBe('*');
  });
  it('every preset is valid in its dialect', () => {
    for (const d of DIALECTS) for (const p of PRESETS) expect(() => analyzeCron(presetFor(p, d.value), { ...o, dialect: d.value }, FROM), `${d.value}: ${p.label}`).not.toThrow();
  });
  it('prints a report', () => {
    const report = cronReport('*/5 * * * *', { ...o, count: 3 }, FROM);
    expect(report.startsWith('Every 5 minutes')).toBe(true);
    expect(report).toContain('Next 3 runs (UTC):');
    expect(report).toContain(' 1. Mon, 01 Jan 2024');
  });
});
