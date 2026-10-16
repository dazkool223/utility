import { describe, expect, it } from 'vitest';
import { dayInfo, fromIsoWeek, isoWeekLabels, weekNumbers } from './logic';

describe('dayInfo', () => {
  it('computes week and day of year', () => {
    const i = dayInfo(2024, 5, 31);
    expect(i.isoWeek).toBe(22);
    expect(i.dayOfYear).toBe(152);
    expect(i.daysInYear).toBe(366);
    expect(i.quarter).toBe(2);
    expect(i.weekday).toBe('Friday');
    expect(i.weekStart).toBe('2024-05-27');
    expect(i.weekEnd).toBe('2024-06-02');
  });
  it('handles ISO year boundaries', () => {
    expect(dayInfo(2021, 1, 1)).toMatchObject({ isoYear: 2020, isoWeek: 53 });
    expect(dayInfo(2024, 12, 30)).toMatchObject({ isoYear: 2025, isoWeek: 1 });
    expect(dayInfo(2026, 1, 1)).toMatchObject({ isoYear: 2026, isoWeek: 1 });
  });
  it('computes US weeks', () => {
    expect(dayInfo(2023, 1, 1).usWeek).toBe(1);
    expect(dayInfo(2023, 1, 7).usWeek).toBe(1);
    expect(dayInfo(2023, 1, 8).usWeek).toBe(2);
  });
  it('rejects impossible dates', () => {
    expect(() => dayInfo(2023, 2, 29)).toThrow('not a real date');
    expect(() => dayInfo(2023, 13, 1)).toThrow();
  });
  it('knows leap years', () => {
    expect(dayInfo(2000, 12, 31).dayOfYear).toBe(366);
    expect(dayInfo(1900, 12, 31).dayOfYear).toBe(365);
  });
});

describe('fromIsoWeek', () => {
  it('finds the Monday of a week', () => {
    expect(fromIsoWeek(2024, 22).date).toBe('2024-05-27');
    expect(fromIsoWeek(2020, 53, 5).date).toBe('2021-01-01');
  });
  it('rejects missing weeks', () => {
    expect(() => fromIsoWeek(2023, 53)).toThrow();
    expect(() => fromIsoWeek(2023, 0)).toThrow();
  });
});

describe('weekNumbers', () => {
  it('describes a date', () => {
    const out = weekNumbers('2024-05-31');
    expect(out).toContain('ISO week: 2024-W22');
    expect(out).toContain('Day of year: 152 of 366 (214 days left)');
  });
  it('handles several lines and week input', () => {
    expect(isoWeekLabels('2024-05-31\n\n2024-W01')).toBe('2024-W22\n2024-W01');
  });
  it('reads today', () => {
    expect(isoWeekLabels('today', new Date(2024, 0, 1))).toBe('2024-W01');
  });
  it('errors on junk and empty input', () => {
    expect(() => weekNumbers('banana')).toThrow('Could not read');
    expect(() => weekNumbers('  ')).toThrow('Enter a date');
  });
});
