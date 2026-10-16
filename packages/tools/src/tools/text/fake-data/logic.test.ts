import { describe, expect, it } from 'vitest';
import { FIELDS, generateFake, parseFieldList } from './logic';

const base = { fields: ['name', 'email', 'city'], count: 5, format: 'json' } as const;

describe('generateFake', () => {
  it('generates JSON records with the requested fields', async () => {
    const rows = JSON.parse(await generateFake(base));
    expect(rows).toHaveLength(5);
    expect(Object.keys(rows[0])).toEqual(['name', 'email', 'city']);
    expect(rows[0].email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });
  it('generates different data on each run', async () => {
    expect(await generateFake(base)).not.toBe(await generateFake(base));
  });
  it('supports NDJSON, CSV and plain lines', async () => {
    const nd = (await generateFake({ ...base, format: 'ndjson' })).split('\n');
    expect(nd).toHaveLength(5);
    expect(JSON.parse(nd[0]!)).toHaveProperty('city');
    const csv = (await generateFake({ ...base, format: 'csv' })).split('\n');
    expect(csv[0]).toBe('name,email,city');
    expect(csv).toHaveLength(6);
    expect((await generateFake({ ...base, format: 'lines' })).split('\n')[0]!.split(' | ')).toHaveLength(3);
  });
  it('produces typed values', async () => {
    const [row] = JSON.parse(await generateFake({ fields: ['number', 'boolean', 'uuid', 'date', 'ip'], count: 1, format: 'json' }));
    expect(typeof row.number).toBe('number');
    expect(typeof row.boolean).toBe('boolean');
    expect(row.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(row.date).toString()).not.toBe('Invalid Date');
    expect(row.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });
  it('every field produces a value', async () => {
    const rows = JSON.parse(await generateFake({ fields: Object.keys(FIELDS), count: 3, format: 'json' }));
    for (const r of rows) for (const k of Object.keys(FIELDS)) expect(r[k], k).not.toBeUndefined();
  });
  it('clamps the row count', async () => {
    expect(JSON.parse(await generateFake({ ...base, count: 0 }))).toHaveLength(1);
    expect(JSON.parse(await generateFake({ fields: ['word'], count: 99_999, format: 'json' }))).toHaveLength(10_000);
  });
  it('explains unknown and missing fields', async () => {
    await expect(generateFake({ ...base, fields: ['name', 'nope'] })).rejects.toThrow(/Unknown field: nope/);
    await expect(generateFake({ ...base, fields: [] })).rejects.toThrow(/at least one field/);
  });
});

describe('parseFieldList', () => {
  it('splits on commas and whitespace', () => {
    expect(parseFieldList('name, email  city,\nphone')).toEqual(['name', 'email', 'city', 'phone']);
    expect(parseFieldList('')).toEqual([]);
  });
});
