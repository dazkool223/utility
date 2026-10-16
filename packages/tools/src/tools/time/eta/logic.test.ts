import { describe, expect, it } from 'vitest';
import { computeEta, formatDuration, parseDuration } from './logic';

describe('parseDuration', () => {
  it('reads common forms', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('01:30:00')).toBe(5400);
    expect(parseDuration('1h 30m')).toBe(5400);
    expect(parseDuration('2d 3h 4m 5s')).toBe(2 * 86400 + 3 * 3600 + 4 * 60 + 5);
    expect(parseDuration('1.5h')).toBe(5400);
    expect(parseDuration('2 hours 5 minutes')).toBe(7500);
  });
  it('rejects junk', () => {
    expect(() => parseDuration('')).toThrow();
    expect(() => parseDuration('soon')).toThrow('Could not read');
    expect(() => parseDuration('1:75')).toThrow('above 59');
    expect(() => parseDuration('5 apples')).toThrow('Could not read');
  });
});

describe('formatDuration', () => {
  it('formats', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(59)).toBe('59s');
    expect(formatDuration(3661)).toBe('1h 1m 1s');
    expect(formatDuration(90000)).toBe('1d 1h 0m 0s');
  });
});

describe('computeEta', () => {
  it('estimates remaining time', () => {
    const r = computeEta(25, 100, 600, 0);
    expect(r.percent).toBe(25);
    expect(r.remainingSeconds).toBeCloseTo(1800);
    expect(r.totalSeconds).toBeCloseTo(2400);
    expect(r.finishAt).toBeCloseTo(1_800_000);
    expect(r.ratePerMinute).toBeCloseTo(2.5);
  });
  it('is finished when done equals total', () => {
    expect(computeEta(10, 10, 5, 100).remainingSeconds).toBe(0);
  });
  it('validates', () => {
    expect(() => computeEta(0, 10, 5, 0)).toThrow('Nothing is done');
    expect(() => computeEta(11, 10, 5, 0)).toThrow('more than the total');
    expect(() => computeEta(1, 0, 5, 0)).toThrow('greater than zero');
    expect(() => computeEta(1, 10, 0, 0)).toThrow();
    expect(() => computeEta(NaN, 10, 1, 0)).toThrow();
  });
});
