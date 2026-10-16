import { describe, expect, it } from 'vitest';
import { gifSize, MAX_FRAMES, outputName, parseTime, planTimestamps } from './logic';

describe('planTimestamps', () => {
  it('spaces frames evenly from the start', () => {
    expect(planTimestamps(0, 1, 10, 4)).toEqual([0, 0.25, 0.5, 0.75]);
    expect(planTimestamps(2, 3, 10, 2)).toEqual([2, 2.5]);
  });
  it('runs to the end of the video when no end is given', () => {
    expect(planTimestamps(0, null, 2, 5)).toHaveLength(10);
  });
  it('clamps the end to the video length', () => {
    expect(planTimestamps(0, 100, 1, 10)).toHaveLength(10);
  });
  it('caps the frame count', () => {
    expect(planTimestamps(0, null, 3600, 25)).toHaveLength(MAX_FRAMES);
  });
  it('rejects bad ranges with plain messages', () => {
    expect(() => planTimestamps(-1, null, 10, 10)).toThrow(/0 or more/);
    expect(() => planTimestamps(10, null, 10, 10)).toThrow(/at or after the end/);
    expect(() => planTimestamps(5, 4, 10, 10)).toThrow(/after the start/);
    expect(() => planTimestamps(0, 0.01, 10, 10)).toThrow(/shorter than one frame/);
    expect(() => planTimestamps(0, 1, 10, 0)).toThrow(/Frames per second/);
  });
});

describe('gifSize', () => {
  it('keeps the aspect ratio', () => expect(gifSize(1920, 1080, 480)).toEqual({ width: 480, height: 270 }));
  it('never scales up', () => expect(gifSize(320, 240, 800)).toEqual({ width: 320, height: 240 }));
  it('never returns zero', () => expect(gifSize(1000, 1, 10)).toEqual({ width: 10, height: 1 }));
});

describe('helpers', () => {
  it('names the output', () => {
    expect(outputName('clip.final.mp4')).toBe('clip.final.gif');
    expect(outputName('.mp4')).toBe('video.gif');
  });
  it('parses times', () => {
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('')).toBeNull();
    expect(parseTime('abc')).toBeNaN();
  });
});
