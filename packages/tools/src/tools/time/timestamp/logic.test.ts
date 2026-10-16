import { describe, expect, it } from 'vitest';
import { isoWithOffset, parseMoment, parseTimestamp, relativeFromNow, validZone } from '../_lib/dates';
import { convertTimestamps, dateToUnixSeconds, timestampToIso } from './logic';

const NOW = Date.UTC(2024, 0, 1, 12, 0, 0);
const o = { zone: 'UTC', force: 'auto' } as const;

describe('parseTimestamp', () => {
  it('auto-detects seconds, milliseconds, microseconds and nanoseconds', () => {
    expect(parseTimestamp('1700000000')).toMatchObject({ unit: 's', ms: 1_700_000_000_000 });
    expect(parseTimestamp('1700000000123')).toMatchObject({ unit: 'ms', ms: 1_700_000_000_123 });
    expect(parseTimestamp('1700000000123456')).toMatchObject({ unit: 'us' });
    expect(parseTimestamp('1700000000123456789')).toMatchObject({ unit: 'ns' });
    expect(parseTimestamp('1700000000123456')!.ms).toBeCloseTo(1_700_000_000_123.456, 2);
  });
  it('handles negative and fractional seconds', () => {
    expect(parseTimestamp('-86400')).toMatchObject({ unit: 's', ms: -86_400_000 });
    expect(parseTimestamp('1700000000.5')).toMatchObject({ unit: 's', ms: 1_700_000_000_500 });
  });
  it('can force a unit', () => {
    expect(parseTimestamp('1700000000', 'ms')!.ms).toBe(1_700_000_000);
  });
  it('returns null for non-numbers', () => {
    expect(parseTimestamp('2024-01-01')).toBeNull();
    expect(parseTimestamp('12ab')).toBeNull();
  });
});

describe('parseMoment', () => {
  it('reads ISO strings, SQL datetimes and now', () => {
    expect(parseMoment('2024-05-31T14:30:00Z').ms).toBe(Date.UTC(2024, 4, 31, 14, 30));
    expect(parseMoment('2024-05-31 14:30:00').ms).toBe(new Date(2024, 4, 31, 14, 30).getTime());
    expect(parseMoment('now', NOW).ms).toBe(NOW);
  });
  it('rejects garbage and empty input', () => {
    expect(() => parseMoment('hello')).toThrow(/Could not read "hello"/);
    expect(() => parseMoment('  ')).toThrow(/Enter a Unix timestamp/);
  });
});

describe('convertTimestamps', () => {
  it('shows every representation for a seconds timestamp', () => {
    const out = convertTimestamps('1700000000', o, NOW);
    expect(out).toContain('seconds');
    expect(out).toContain('2023-11-14T22:13:20.000Z');
    expect(out).toContain('Tue, 14 Nov 2023, 22:13:20 UTC');
    expect(out).toContain('Unix seconds: 1700000000');
    expect(out).toContain('Unix ms:      1700000000000');
    expect(out).toContain('2 months ago');
  });
  it('converts a date to a timestamp', () => {
    const out = convertTimestamps('2024-01-01T00:00:00Z', o, NOW);
    expect(out).toContain('Unix seconds: 1704067200');
    expect(out).toContain('a date string');
  });
  it('uses the requested time zone', () => {
    const out = convertTimestamps('1700000000', { zone: 'Asia/Tokyo', force: 'auto' }, NOW);
    expect(out).toContain('2023-11-15T07:13:20.000+09:00');
  });
  it('converts several lines at once', () => {
    const out = convertTimestamps('1700000000\n1700000001', o, NOW);
    expect(out.split('\n\n')).toHaveLength(2);
    expect(out).toContain('1700000001\n');
  });
  it('rejects unknown zones and out-of-range moments', () => {
    expect(() => convertTimestamps('1', { zone: 'Mars/Base', force: 'auto' })).toThrow(/not a known time zone/);
    expect(() => convertTimestamps('99999999999999999999', { zone: 'UTC', force: 'ms' })).toThrow(/outside the range/);
  });
  it('gives simple helpers for the Pipeline', () => {
    expect(timestampToIso('0\n86400')).toBe('1970-01-01T00:00:00.000Z\n1970-01-02T00:00:00.000Z');
    expect(dateToUnixSeconds('1970-01-02T00:00:00Z')).toBe('86400');
  });
  it('handles many lines', () => {
    const lines = Array.from({ length: 5000 }, (_, i) => String(1_700_000_000 + i)).join('\n');
    expect(convertTimestamps(lines, o, NOW).split('\n\n')).toHaveLength(5000);
  });
});

describe('helpers', () => {
  it('formats relative times', () => {
    expect(relativeFromNow(NOW + 3 * 3600_000, NOW)).toBe('in 3 hours');
    expect(relativeFromNow(NOW - 86400_000, NOW)).toBe('yesterday');
    expect(relativeFromNow(NOW + 200, NOW)).toBe('just now');
  });
  it('formats offsets', () => {
    expect(isoWithOffset(new Date(Date.UTC(2024, 0, 1)), 'UTC')).toBe('2024-01-01T00:00:00.000Z');
    expect(isoWithOffset(new Date(Date.UTC(2024, 0, 1)), 'America/New_York')).toBe('2023-12-31T19:00:00.000-05:00');
    expect(isoWithOffset(new Date(Date.UTC(2024, 0, 1)), 'Asia/Kolkata')).toBe('2024-01-01T05:30:00.000+05:30');
  });
  it('validates zones', () => {
    expect(validZone('Europe/London')).toBe('Europe/London');
    expect(validZone('')).toBe('');
    expect(() => validZone('Nope/Zone')).toThrow();
  });
});

describe('zone-aware date parsing', () => {
  it('reads zone-less dates in the chosen zone', () => {
    const out = convertTimestamps('2024-05-31 14:30:00', { zone: 'Asia/Tokyo', force: 'auto' }, NOW);
    expect(out).toContain('2024-05-31T05:30:00.000Z');
    expect(out).toContain('in Asia/Tokyo');
  });
  it('treats date-only input as midnight in that zone', () => {
    expect(convertTimestamps('2024-01-01', o, NOW)).toContain('Unix seconds: 1704067200');
  });
  it('rejects impossible dates', () => {
    expect(() => convertTimestamps('2024-13-45', o, NOW)).toThrow();
  });
});
