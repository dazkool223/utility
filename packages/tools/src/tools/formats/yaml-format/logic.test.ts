import { describe, expect, it } from 'vitest';
import { formatYaml } from './logic';

const o = { indent: 2, sortKeys: false } as const;

describe('formatYaml', () => {
  it('normalises indentation', () => {
    expect(formatYaml('a:\n      b: 1\n      c:\n          - x', o)).toBe('a:\n  b: 1\n  c:\n    - x');
  });
  it('supports 4-space indent', () => {
    expect(formatYaml('a:\n  b: 1', { ...o, indent: 4 })).toBe('a:\n    b: 1');
  });
  it('keeps comments', () => {
    expect(formatYaml('# top\na: 1 # side\n', o)).toBe('# top\na: 1 # side');
  });
  it('sorts keys when asked', () => {
    expect(formatYaml('b: 1\na: 2', { ...o, sortKeys: true })).toBe('a: 2\nb: 1');
  });
  it('keeps multiple documents', () => {
    expect(formatYaml('a: 1\n---\nb: 2', o)).toBe('a: 1\n---\nb: 2');
  });
  it('keeps unicode and does not fold long lines', () => {
    const long = 'x'.repeat(200);
    expect(formatYaml(`k: ${long}\nu: é✓`, o)).toBe(`k: ${long}\nu: é✓`);
  });
  it('rejects invalid YAML', () => {
    expect(() => formatYaml('a: [1', o)).toThrow(/Invalid YAML at line/);
  });
  it('handles large input', () => {
    const big = Array.from({ length: 50_000 }, (_, i) => `- id: ${i}`).join('\n');
    expect(formatYaml(big, o).split('\n')).toHaveLength(50_000);
  });
});
