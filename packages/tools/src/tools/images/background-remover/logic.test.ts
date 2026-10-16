import { describe, expect, it } from 'vitest';
import { cutoutName, describeProgress, parseHexColor } from './logic';

describe('parseHexColor', () => {
  it('reads long and short hex, with or without #', () => {
    expect(parseHexColor('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(parseHexColor('FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor(' #0a0 ')).toEqual({ r: 0, g: 170, b: 0 });
  });
  it('rejects anything else', () => {
    for (const bad of ['', '#', '#12', '#12345', '#1234567', 'red', '#gggggg']) expect(parseHexColor(bad)).toBeNull();
  });
});

describe('cutoutName', () => {
  it('swaps the extension for -no-background.png', () => {
    expect(cutoutName('photo.JPG')).toBe('photo-no-background.png');
    expect(cutoutName('my.holiday.photo.webp')).toBe('my.holiday.photo-no-background.png');
  });
  it('copes with no extension and with empty names', () => {
    expect(cutoutName('selfie')).toBe('selfie-no-background.png');
    expect(cutoutName('.png')).toBe('image-no-background.png');
    expect(cutoutName('café 🐱.jpeg')).toBe('café 🐱-no-background.png');
  });
});

describe('describeProgress', () => {
  it('describes model and engine downloads', () => {
    expect(describeProgress('fetch:/models/isnet', 50, 200)).toEqual({ label: 'Loading the model (first use only)…', fraction: 0.25 });
    expect(describeProgress('fetch:/onnxruntime-web/ort-wasm-simd-threaded.wasm', 1, 1).label).toBe('Loading the engine…');
  });
  it('describes compute steps and unknown keys', () => {
    expect(describeProgress('compute:inference', 1, 4)).toEqual({ label: 'Finding the subject…', fraction: 0.25 });
    expect(describeProgress('compute:something-new', 0, 4).label).toBe('Working…');
  });
  it('clamps the fraction and tolerates a zero total', () => {
    expect(describeProgress('compute:mask', 9, 4).fraction).toBe(1);
    expect(describeProgress('compute:mask', 1, 0).fraction).toBeUndefined();
  });
});
