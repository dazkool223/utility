import { describe, expect, it } from 'vitest';
import { addLap, bestWorst, formatStopwatch, lapsToText } from './logic';

describe('formatStopwatch', () => {
  it('formats', () => {
    expect(formatStopwatch(0)).toBe('00:00.000');
    expect(formatStopwatch(1234)).toBe('00:01.234');
    expect(formatStopwatch(61_005)).toBe('01:01.005');
    expect(formatStopwatch(3_723_456)).toBe('01:02:03.456');
    expect(formatStopwatch(-5)).toBe('00:00.000');
  });
});

describe('laps', () => {
  it('records splits', () => {
    let laps = addLap([], 1000);
    laps = addLap(laps, 2500);
    laps = addLap(laps, 3000);
    expect(laps.map((l) => l.split)).toEqual([1000, 1500, 500]);
    expect(bestWorst(laps)).toEqual({ best: 2, worst: 1 });
    expect(lapsToText(laps).split('\n')[1]).toBe('Lap 2\t00:01.500\t00:02.500');
  });
  it('has no best/worst below two laps', () => {
    expect(bestWorst(addLap([], 5))).toBeNull();
    expect(bestWorst([])).toBeNull();
  });
});
