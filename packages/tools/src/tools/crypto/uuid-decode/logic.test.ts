import { describe, expect, it } from 'vitest';
import { decodeUuid, normaliseUuid } from './logic';

describe('decodeUuid (RFC 9562 examples)', () => {
  it('v1: C232AB00-9414-11EC-B3C8-9F6BDECED846', () => {
    const d = decodeUuid('C232AB00-9414-11EC-B3C8-9F6BDECED846');
    expect(d.version).toBe(1);
    expect(d.timestamp?.iso).toBe('2022-02-22T19:22:22.000Z');
    expect(d.node).toBe('9f:6b:de:ce:d8:46');
    expect(d.variant).toContain('RFC');
  });
  it('v6: 1EC9414C-232A-6B00-B3C8-9F6BDECED846', () => {
    const d = decodeUuid('1EC9414C-232A-6B00-B3C8-9F6BDECED846');
    expect(d.version).toBe(6);
    expect(d.timestamp?.iso).toBe('2022-02-22T19:22:22.000Z');
  });
  it('v7: 017F22E2-79B0-7CC3-98C4-DC0C0C07398F', () => {
    const d = decodeUuid('017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
    expect(d.version).toBe(7);
    expect(d.timestamp).toEqual({ ms: 1645557742000, iso: '2022-02-22T19:22:22.000Z' });
  });
  it('v4 and v3/v5 have no timestamp', () => {
    const v4 = decodeUuid('550e8400-e29b-41d4-a716-446655440000');
    expect(v4.version).toBe(4);
    expect(v4.timestamp).toBeUndefined();
    expect(decodeUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8').version).toBe(1);
    expect(decodeUuid('cfbff0d1-9375-5685-968c-48ce8b15ae17').versionName).toContain('v5');
  });
  it('nil and max', () => {
    expect(decodeUuid('00000000-0000-0000-0000-000000000000').versionName).toContain('Nil');
    expect(decodeUuid('ffffffff-ffff-ffff-ffff-ffffffffffff').versionName).toContain('Max');
  });
});

describe('normaliseUuid', () => {
  it('accepts braces, urn prefix and missing hyphens', () => {
    const want = '550e8400-e29b-41d4-a716-446655440000';
    expect(normaliseUuid('{550E8400-E29B-41D4-A716-446655440000}')).toBe(want);
    expect(normaliseUuid('urn:uuid:550e8400-e29b-41d4-a716-446655440000')).toBe(want);
    expect(normaliseUuid('550e8400e29b41d4a716446655440000')).toBe(want);
  });
  it('rejects malformed input', () => {
    expect(() => normaliseUuid('hello')).toThrow(/not a UUID/);
    expect(() => normaliseUuid('550e8400-e29b41d4-a716-446655440000')).toThrow(/hyphens/);
    expect(() => normaliseUuid('')).toThrow(/not a UUID/);
  });
});
