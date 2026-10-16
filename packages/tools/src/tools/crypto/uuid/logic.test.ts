import { describe, expect, it } from 'vitest';
import { generateUuids } from './logic';

const re = (v: number) => new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${v}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`);
const opts = { uppercase: false, hyphens: true } as const;

describe('generateUuids', () => {
  it('generates valid v4, v7 and v1', () => {
    expect(generateUuids({ ...opts, version: 'v4', count: 1 })).toMatch(re(4));
    expect(generateUuids({ ...opts, version: 'v7', count: 1 })).toMatch(re(7));
    expect(generateUuids({ ...opts, version: 'v1', count: 1 })).toMatch(re(1));
  });
  it('generates unique bulk ids', () => {
    const ids = generateUuids({ ...opts, version: 'v4', count: 1000 }).split('\n');
    expect(ids).toHaveLength(1000);
    expect(new Set(ids).size).toBe(1000);
  });
  it('v7 ids sort by creation order', () => {
    const ids = generateUuids({ ...opts, version: 'v7', count: 50 }).split('\n');
    expect([...ids].sort()).toEqual(ids);
  });
  it('applies uppercase and no-hyphen options', () => {
    expect(generateUuids({ version: 'v4', count: 1, uppercase: true, hyphens: false })).toMatch(/^[0-9A-F]{32}$/);
  });
  it('clamps count', () => {
    expect(generateUuids({ ...opts, version: 'v4', count: 0 }).split('\n')).toHaveLength(1);
    expect(generateUuids({ ...opts, version: 'v4', count: 99_999 }).split('\n')).toHaveLength(10_000);
  });
});
