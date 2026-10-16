import { describe, expect, it } from 'vitest';
import { validateYaml } from './logic';

describe('validateYaml', () => {
  it('accepts valid YAML and describes it', () => {
    const r = validateYaml('a: 1\nb:\n  - x\n  - y');
    expect(r).toContain('Valid YAML');
    expect(r).toContain('mapping with 2 keys');
  });
  it('counts documents and sequences', () => {
    expect(validateYaml('- 1\n- 2\n---\n- 3')).toContain('Documents: 2');
    expect(validateYaml('- 1\n- 2')).toContain('sequence with 2 items');
  });
  it('flags duplicate keys with line and column', () => {
    expect(() => validateYaml('a: 1\nb: 2\na: 3')).toThrow(/line 3, column 1: Map keys must be unique/);
  });
  it('flags bad indentation and tabs', () => {
    expect(() => validateYaml('a:\n  b: 1\n c: 2')).toThrow(/line 3/);
    expect(() => validateYaml('a:\n\tb: 1')).toThrow(/line 2/);
  });
  it('flags unresolved aliases and unclosed flows', () => {
    expect(() => validateYaml('a: *nope')).toThrow(/alias/i);
    expect(() => validateYaml('a: [1, 2')).toThrow(/problem/);
  });
  it('reports several problems at once', () => {
    expect(() => validateYaml('a: 1\na: 2\nb: 1\nb: 2')).toThrow(/2 problems found/);
  });
  it('handles empty input, unicode and large input', () => {
    expect(validateYaml('')).toContain('Documents');
    expect(validateYaml('k: é✓')).toContain('Valid YAML');
    expect(validateYaml(Array.from({ length: 50_000 }, (_, i) => `- id: ${i}`).join('\n'))).toContain('50000 items');
  });
});
