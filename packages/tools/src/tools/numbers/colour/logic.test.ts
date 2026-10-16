import { describe, expect, it } from 'vitest';
import { describeColour } from './logic';

const get = (input: string, k: string) => describeColour(input).rows.find(([key]) => key === k)?.[1];

describe('describeColour', () => {
  it('rebeccapurple in every format', () => {
    const i = 'rebeccapurple';
    expect(get(i, 'HEX')).toBe('#663399');
    expect(get(i, 'RGB')).toBe('rgb(102 51 153)');
    expect(get(i, 'HSL')).toBe('hsl(270 50% 40%)');
    expect(get(i, 'HWB')).toBe('hwb(270 20% 40%)');
    expect(get(i, 'LAB')).toBe('lab(32.39 38.42 -47.69)');
    expect(get(i, 'LCH')).toBe('lch(32.39 61.24 308.86)');
    expect(get(i, 'OKLCH')).toBe('oklch(0.4403 0.1603 303.37)');
    expect(get(i, 'CSS name')).toBe('rebeccapurple');
  });
  it('accepts hex shorthand, bare hex and alpha', () => {
    expect(get('#f60', 'HEX')).toBe('#FF6600');
    expect(get('ff6600', 'HEX')).toBe('#FF6600');
    const a = describeColour('#ff000080');
    expect(a.alpha).toBe(0.502);
    expect(a.rows.find(([k]) => k === 'HEX with alpha')?.[1]).toBe('#FF000080');
    expect(get('rgb(255 0 0 / 50%)', 'RGB')).toBe('rgb(255 0 0 / 0.5)');
  });
  it('converts between functional notations', () => {
    expect(get('hsl(0 100% 50%)', 'HEX')).toBe('#FF0000');
    expect(get('oklch(0.62796 0.25768 29.2339)', 'HEX')).toBe('#FF0000');
    expect(get('lab(54.2905 80.8049 69.891)', 'HEX')).toBe('#FF0000');
    expect(get('hwb(0 0% 0%)', 'HEX')).toBe('#FF0000');
  });
  it('greys have a defined hue and WCAG contrast is right', () => {
    expect(get('#808080', 'HSL')).toBe('hsl(0 0% 50.2%)');
    expect(get('white', 'Contrast with black')).toBe('21:1 (AAA)');
    expect(get('#777777', 'Contrast with white')).toContain('4.48:1');
  });
  it('flags out-of-gamut colours', () => {
    expect(describeColour('oklch(0.7 0.4 150)').outsideSrgb).toBe(true);
    expect(describeColour('#123456').outsideSrgb).toBe(false);
  });
  it('names the closest CSS colour when there is no exact match', () => {
    expect(get('#fe0000', 'CSS name')).toBe('none (closest: red)');
  });
  it('rejects nonsense', () => {
    expect(() => describeColour('')).toThrow(/Enter a colour/);
    expect(() => describeColour('not a colour')).toThrow(/not a colour I can read/);
    expect(() => describeColour('#12')).toThrow(/not a colour/);
  });
});
