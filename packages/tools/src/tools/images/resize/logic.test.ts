import { describe, expect, it } from 'vitest';
import { fitEdge, linkedHeight, linkedWidth, MAX_EDGE, targetSize } from './logic';

describe('targetSize', () => {
  it('uses the typed pixel size', () => {
    expect(targetSize(1000, 500, { mode: 'pixels', width: 300.4, height: 200, percent: 100 })).toEqual({ width: 300, height: 200 });
  });
  it('scales by percent and never goes below 1 pixel', () => {
    expect(targetSize(1000, 500, { mode: 'percent', width: 0, height: 0, percent: 50 })).toEqual({ width: 500, height: 250 });
    expect(targetSize(10, 3, { mode: 'percent', width: 0, height: 0, percent: 1 })).toEqual({ width: 1, height: 1 });
    expect(targetSize(100, 100, { mode: 'percent', width: 0, height: 0, percent: 300 })).toEqual({ width: 300, height: 300 });
  });
  it('rejects sizes that make no sense', () => {
    expect(() => targetSize(10, 10, { mode: 'pixels', width: 0, height: 5, percent: 100 })).toThrow(/at least 1 pixel/);
    expect(() => targetSize(10, 10, { mode: 'pixels', width: NaN, height: 5, percent: 100 })).toThrow(/at least 1 pixel/);
    expect(() => targetSize(10, 10, { mode: 'percent', width: 0, height: 0, percent: 0 })).toThrow(/more than 0%/);
    expect(() => targetSize(10, 10, { mode: 'pixels', width: MAX_EDGE + 1, height: 5, percent: 100 })).toThrow(/at most/);
    expect(() => targetSize(10, 10, { mode: 'pixels', width: 16000, height: 16000, percent: 100 })).toThrow(/megapixels/);
  });
});

describe('aspect helpers', () => {
  it('keep the source shape', () => {
    expect(linkedHeight(1600, 900, 800)).toBe(450);
    expect(linkedWidth(1600, 900, 450)).toBe(800);
    expect(linkedHeight(3, 1000, 1)).toBe(333);
  });
  it('fit the longest edge', () => {
    expect(fitEdge(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 });
    expect(fitEdge(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 });
  });
});
