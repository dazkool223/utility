import { describe, expect, it } from 'vitest';
import { decodeUlid, generateUlids, ULID_RE } from './logic';

describe('decodeUlid', () => {
  it('decodes the spec example 01ARZ3NDEKTSV4RRFFQ69G5FAV', () => {
    const d = decodeUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(d.timestampMs).toBe(1469922850259);
    expect(d.iso).toBe('2016-07-30T23:54:10.259Z');
    expect(d.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(d.randomHex).toHaveLength(20);
  });
  it('accepts lowercase and surrounding whitespace', () => {
    expect(decodeUlid(' 01arz3ndektsv4rrffq69g5fav ').timestampMs).toBe(1469922850259);
  });
  it('decodes the minimum and maximum', () => {
    expect(decodeUlid('0'.repeat(26)).timestampMs).toBe(0);
    expect(decodeUlid('7ZZZZZZZZZZZZZZZZZZZZZZZZZ').timestampMs).toBe(281474976710655);
  });
  it('rejects malformed input', () => {
    expect(() => decodeUlid('abc')).toThrow(/26 characters/);
    expect(() => decodeUlid('01ARZ3NDEKTSV4RRFFQ69G5FAU')).toThrow(/without I, L, O and U/);
    expect(() => decodeUlid('8ZZZZZZZZZZZZZZZZZZZZZZZZZ')).toThrow(/too large/);
  });
});

describe('generateUlids', () => {
  it('generates valid, unique ULIDs', async () => {
    const ids = (await generateUlids({ count: 500, monotonic: false, lowercase: false })).split('\n');
    expect(ids).toHaveLength(500);
    expect(new Set(ids).size).toBe(500);
    for (const id of ids) expect(id).toMatch(ULID_RE);
  });
  it('monotonic ULIDs sort in order even within one millisecond', async () => {
    const ids = (await generateUlids({ count: 200, monotonic: true, lowercase: false, time: 1700000000000 })).split('\n');
    expect([...ids].sort()).toEqual(ids);
    expect(decodeUlid(ids[0]!).timestampMs).toBe(1700000000000);
  });
  it('lowercase option and bounds', async () => {
    expect(await generateUlids({ count: 1, monotonic: false, lowercase: true })).toMatch(/^[0-9a-z]{26}$/);
    expect((await generateUlids({ count: 0, monotonic: false, lowercase: false })).split('\n')).toHaveLength(1);
    await expect(generateUlids({ count: 1, monotonic: false, lowercase: false, time: -5 })).rejects.toThrow(/out of range/);
  });
});
