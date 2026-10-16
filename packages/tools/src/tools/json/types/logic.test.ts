import { describe, expect, it } from 'vitest';
import { jsonToTypes, LANGUAGES } from './logic';

const sample = '{"id":1,"name":"Ada","tags":["a"],"nested":{"ok":true},"score":1.5}';

describe('jsonToTypes', () => {
  it('generates TypeScript interfaces', async () => {
    const out = await jsonToTypes(sample, 'typescript', 'User');
    expect(out).toContain('export interface User');
    expect(out).toMatch(/id:\s+number;/);
    expect(out).toMatch(/tags:\s+string\[\];/);
  });
  it('generates Go structs', async () => {
    expect(await jsonToTypes(sample, 'go', 'User')).toContain('type User struct');
  });
  it('generates Zod schemas', async () => {
    expect(await jsonToTypes(sample, 'typescript-zod', 'User')).toContain('z.object');
  });
  it('supports every listed language', async () => {
    for (const l of LANGUAGES) {
      const out = await jsonToTypes('{"a":1,"b":[{"c":"x"}]}', l.value, 'Root');
      expect(out.length, l.value).toBeGreaterThan(20);
    }
  }, 60_000);
  it('handles unicode keys and values', async () => {
    expect(await jsonToTypes('{"é":"ü"}', 'typescript', 'Root')).toContain('string');
  });
  it('handles an array root and large samples', async () => {
    const big = JSON.stringify(Array.from({ length: 5000 }, (_, i) => ({ i, s: 'x' })));
    expect(await jsonToTypes(big, 'typescript', 'Rows')).toContain('export interface');
  });
  it('rejects invalid JSON', async () => {
    await expect(jsonToTypes('{', 'typescript', 'X')).rejects.toThrow(/Invalid JSON/);
  });
});
