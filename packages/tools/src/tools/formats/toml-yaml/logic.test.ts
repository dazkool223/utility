import { describe, expect, it } from 'vitest';
import { tomlToYaml, yamlToToml } from './logic';

describe('TOML <-> YAML', () => {
  it('converts TOML to YAML', () => {
    expect(tomlToYaml('title = "x"\n[owner]\nname = "Ada"\nids = [1, 2]')).toBe('title: x\nowner:\n  name: Ada\n  ids:\n    - 1\n    - 2');
  });
  it('converts YAML to TOML', () => {
    const toml = yamlToToml('title: x\nowner:\n  name: Ada');
    expect(toml).toContain('title = "x"');
    expect(toml).toContain('[owner]');
  });
  it('round-trips with unicode', () => {
    expect(tomlToYaml(yamlToToml('a: é✓\nb:\n  c: 1'))).toBe('a: é✓\nb:\n  c: 1');
  });
  it('turns dates into ISO strings', () => {
    expect(tomlToYaml('d = 1979-05-27T07:32:00Z')).toContain('1979-05-27T07:32:00.000Z');
  });
  it('rejects malformed input and untranslatable YAML', () => {
    expect(() => tomlToYaml('a = ')).toThrow(/Invalid TOML/);
    expect(() => yamlToToml('a: [1')).toThrow(/Invalid YAML/);
    expect(() => yamlToToml('- 1\n- 2')).toThrow(/top level/);
    expect(() => yamlToToml('a: null')).toThrow(/null/);
  });
  it('handles large input', () => {
    const big = Array.from({ length: 30_000 }, (_, i) => `k${i} = ${i}`).join('\n');
    expect(tomlToYaml(big).split('\n')).toHaveLength(30_000);
  });
});
