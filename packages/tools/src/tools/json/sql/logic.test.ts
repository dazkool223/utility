import { describe, expect, it } from 'vitest';
import { jsonToSql } from './logic';

const o = { table: 't', dialect: 'postgres', createTable: true } as const;

describe('jsonToSql', () => {
  it('generates CREATE TABLE and INSERT for postgres', () => {
    expect(jsonToSql('[{"id":1,"name":"Ada","ok":true,"score":1.5}]', o)).toBe(
      'CREATE TABLE "t" (\n  "id" BIGINT,\n  "name" TEXT,\n  "ok" BOOLEAN,\n  "score" DOUBLE PRECISION\n);\n\nINSERT INTO "t" ("id", "name", "ok", "score") VALUES\n  (1, \'Ada\', TRUE, 1.5);',
    );
  });
  it('escapes quotes and handles NULL and missing keys', () => {
    const sql = jsonToSql('[{"a":"O\'Brien"},{"b":null}]', { ...o, createTable: false });
    expect(sql).toBe('INSERT INTO "t" ("a", "b") VALUES\n  (\'O\'\'Brien\', NULL),\n  (NULL, NULL);');
  });
  it('uses dialect-specific quoting and types', () => {
    expect(jsonToSql('[{"a":1}]', { ...o, dialect: 'mysql' })).toContain('`a` BIGINT');
    expect(jsonToSql('[{"a":"x"}]', { ...o, dialect: 'mssql' })).toContain("[a] NVARCHAR(MAX)");
    expect(jsonToSql('[{"a":"x"}]', { ...o, dialect: 'mssql' })).toContain("N'x'");
  });
  it('escapes backslashes for MySQL', () => {
    expect(jsonToSql('[{"a":"x\\\\y"}]', { ...o, dialect: 'mysql', createTable: false })).toContain("'x\\\\y'");
  });
  it('stores nested values as JSON text', () => {
    expect(jsonToSql('[{"a":{"b":1}}]', o)).toContain('JSONB');
    expect(jsonToSql('[{"a":[1]}]', { ...o, createTable: false })).toContain("'[1]'");
  });
  it('widens mixed types', () => {
    expect(jsonToSql('[{"a":1},{"a":1.5}]', o)).toContain('DOUBLE PRECISION');
    expect(jsonToSql('[{"a":1},{"a":"x"}]', o)).toContain('"a" TEXT');
  });
  it('accepts a single object and unicode', () => {
    expect(jsonToSql('{"n":"é"}', { ...o, createTable: false })).toContain("'é'");
  });
  it('rejects empty and non-object rows', () => {
    expect(() => jsonToSql('[]', o)).toThrow(/empty/);
    expect(() => jsonToSql('[1,2]', o)).toThrow(/object/);
    expect(() => jsonToSql('[{}]', o)).toThrow(/no keys/);
    expect(() => jsonToSql('[', o)).toThrow(/Invalid JSON/);
  });
  it('handles many rows', () => {
    const rows = JSON.stringify(Array.from({ length: 20_000 }, (_, i) => ({ i })));
    expect(jsonToSql(rows, o).split('\n').length).toBeGreaterThan(20_000);
  });
});
