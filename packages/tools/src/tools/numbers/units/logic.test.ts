import { describe, expect, it } from 'vitest';
import { CATEGORIES, convertAll, convertValue, findCategory, findUnit, formatNumber, parseQuantity } from './logic';

const conv = (v: number, from: string, to: string, cat: string) => {
  const c = findCategory(cat);
  return convertValue(v, c.units.find((u) => u.id === from)!, c.units.find((u) => u.id === to)!);
};

describe('known conversions', () => {
  it('length', () => {
    expect(conv(1, 'mi', 'km', 'length')).toBeCloseTo(1.609344, 9);
    expect(conv(12, 'in', 'ft', 'length')).toBeCloseTo(1, 12);
    expect(conv(1, 'ly', 'km', 'length')).toBeCloseTo(9460730472580.8, 0);
  });
  it('mass', () => {
    expect(conv(1, 'lb', 'kg', 'mass')).toBeCloseTo(0.45359237, 10);
    expect(conv(16, 'oz', 'lb', 'mass')).toBeCloseTo(1, 9);
  });
  it('temperature', () => {
    expect(conv(0, 'c', 'f', 'temperature')).toBeCloseTo(32, 10);
    expect(conv(100, 'c', 'k', 'temperature')).toBeCloseTo(373.15, 10);
    expect(conv(-40, 'c', 'f', 'temperature')).toBeCloseTo(-40, 10);
    expect(conv(98.6, 'f', 'c', 'temperature')).toBeCloseTo(37, 9);
    expect(conv(0, 'k', 'c', 'temperature')).toBeCloseTo(-273.15, 10);
  });
  it('data uses 1000 and 1024 correctly', () => {
    expect(conv(1, 'GB', 'MB', 'data')).toBe(1000);
    expect(conv(1, 'GiB', 'MiB', 'data')).toBe(1024);
    expect(conv(1, 'B', 'bit', 'data')).toBe(8);
    expect(conv(100, 'Mbit', 'MB', 'data')).toBeCloseTo(12.5, 10);
  });
  it('speed, pressure, time, volume, angle, power', () => {
    expect(conv(100, 'kph', 'mph', 'speed')).toBeCloseTo(62.1371192, 6);
    expect(conv(1, 'atm', 'psi', 'pressure')).toBeCloseTo(14.6959488, 6);
    expect(conv(1, 'd', 'h', 'time')).toBe(24);
    expect(conv(1, 'gal', 'l', 'volume')).toBeCloseTo(3.785411784, 9);
    expect(conv(180, 'deg', 'rad', 'angle')).toBeCloseTo(Math.PI, 12);
    expect(conv(1, 'hp', 'kw', 'power')).toBeCloseTo(0.745699872, 8);
  });
  it('every unit round-trips through the base unit', () => {
    for (const c of CATEGORIES) {
      const first = c.units[0]!;
      for (const unit of c.units) {
        const back = convertValue(convertValue(42, first, unit), unit, first);
        expect(back).toBeCloseTo(42, 6);
      }
    }
  });
});

describe('parsing and lookup', () => {
  it('parses values with and without units', () => {
    expect(parseQuantity('5 km')).toEqual({ value: 5, unitText: 'km' });
    expect(parseQuantity('-3.5e2°C')).toEqual({ value: -350, unitText: '°C' });
    expect(parseQuantity('1,000')).toEqual({ value: 1000, unitText: '' });
    expect(parseQuantity('.5 m')).toEqual({ value: 0.5, unitText: 'm' });
  });
  it('finds units by symbol, alias and name', () => {
    expect(findUnit('KM')?.unit.id).toBe('km');
    expect(findUnit('kilometres')?.unit.id).toBe('km');
    expect(findUnit('MB')?.unit.id).toBe('MB');
    expect(findUnit('mph')?.unit.id).toBe('mph');
    expect(findUnit('°F')?.unit.id).toBe('f');
    expect(findUnit('nope')).toBeNull();
  });
  it('convertAll uses the typed unit over the default', () => {
    const r = convertAll('5 km', 'mass', 'kg');
    expect(r.category.id).toBe('length');
    expect(r.rows.find((x) => x.unit.id === 'mi')?.result).toBe('3.10685596119');
    expect(r.rows.find((x) => x.unit.id === 'm')?.result).toBe('5,000');
  });
  it('convertAll falls back to the default unit', () => {
    const r = convertAll('1', 'length', 'm');
    expect(r.rows.find((x) => x.unit.id === 'ft')?.result).toBe('3.28083989501');
  });
  it('rejects malformed input', () => {
    expect(() => convertAll('', 'length', 'm')).toThrow(/Enter a number/);
    expect(() => convertAll('abc', 'length', 'm')).toThrow(/does not start with a number/);
    expect(() => convertAll('5 parsecs', 'length', 'm')).toThrow(/not recognised/);
    expect(() => findCategory('zzz')).toThrow(/Unknown category/);
  });
});

describe('formatNumber', () => {
  it('trims floating-point noise and groups thousands', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1234567.891)).toBe('1,234,567.891');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1e-9)).toBe('1e-9');
    expect(formatNumber(1.5e20)).toBe('1.5e20');
    expect(formatNumber(-2.5)).toBe('-2.5');
  });
});
