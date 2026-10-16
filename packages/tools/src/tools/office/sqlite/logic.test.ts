import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { ToolError } from '@/core/types';
import { describeCell, isSqliteFile, listSchema, openDatabase, quoteIdent, runSql, selectAllSql } from './logic';

let SQL: SqlJsStatic;

function sampleDb(): Uint8Array {
  const db = new SQL.Database();
  db.run(`CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL, photo BLOB);
          INSERT INTO people (name, score, photo) VALUES ('Ada', 9.5, x'0102'), ('Zoë 世界', NULL, NULL), ('O''Brien', 3, NULL);
          CREATE TABLE "odd ""name""" (x);
          CREATE VIEW top AS SELECT name FROM people WHERE score > 5;`);
  const bytes = db.export();
  db.close();
  return bytes;
}

beforeAll(async () => {
  SQL = await initSqlJs();
});

describe('openDatabase', () => {
  it('recognises SQLite files by header', () => {
    expect(isSqliteFile(sampleDb())).toBe(true);
    expect(isSqliteFile(new TextEncoder().encode('hello world, not a db'))).toBe(false);
    expect(isSqliteFile(new Uint8Array(3))).toBe(false);
  });

  it('rejects other files with a plain message', () => {
    expect(() => openDatabase(SQL, new TextEncoder().encode('name,age\nAda,36\nLinus,55\n'))).toThrow(ToolError);
    expect(() => openDatabase(SQL, new Uint8Array(0))).toThrow(/not a SQLite/);
  });

  it('rejects a file with a good header and damaged body', () => {
    const bytes = sampleDb().slice(0, 100);
    expect(() => openDatabase(SQL, bytes)).toThrow(ToolError);
  });
});

describe('listSchema', () => {
  it('lists tables, views, columns and row counts', () => {
    const schema = listSchema(openDatabase(SQL, sampleDb()));
    const people = schema.find((s) => s.name === 'people')!;
    expect(people.kind).toBe('table');
    expect(people.rows).toBe(3);
    expect(people.columns.map((c) => c.name)).toEqual(['id', 'name', 'score', 'photo']);
    expect(people.columns[0]).toMatchObject({ primaryKey: true, type: 'INTEGER' });
    expect(people.columns[1]).toMatchObject({ notNull: true });
    expect(schema.find((s) => s.name === 'top')).toMatchObject({ kind: 'view', rows: null });
    expect(schema.find((s) => s.name === 'odd "name"')?.rows).toBe(0);
  });

  it('is empty for an empty database', () => {
    const db = new SQL.Database();
    db.run('CREATE TABLE t (a); DROP TABLE t;');
    expect(listSchema(openDatabase(SQL, db.export()))).toEqual([]);
  });
});

describe('runSql', () => {
  it('returns columns and rows, with blobs summarised and NULLs kept', () => {
    const r = runSql(openDatabase(SQL, sampleDb()), 'SELECT name, score, photo FROM people ORDER BY id');
    expect(r.columns).toEqual(['name', 'score', 'photo']);
    expect(r.rows[0]).toEqual(['Ada', 9.5, { blob: 2 }]);
    expect(r.rows[1]).toEqual(['Zoë 世界', null, null]);
    expect(describeCell(r.rows[0]![2]!)).toBe('<BLOB 2 bytes>');
    expect(describeCell(null)).toBe('NULL');
    expect(r.truncated).toBe(false);
    expect(r.changes).toBeNull();
  });

  it('limits rows without reading the whole table', () => {
    const db = openDatabase(SQL, sampleDb());
    const r = runSql(db, 'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n WHERE i < 5000) SELECT i FROM n', 100);
    expect(r.rows).toHaveLength(100);
    expect(r.truncated).toBe(true);
  });

  it('reports the last result of several statements and counts changes', () => {
    const db = openDatabase(SQL, sampleDb());
    const r = runSql(db, "INSERT INTO people (name) VALUES ('Linus'); SELECT count(*) AS n FROM people;");
    expect(r.statements).toBe(2);
    expect(r.rows).toEqual([[4]]);
    const u = runSql(db, "UPDATE people SET score = 1 WHERE name <> 'Ada'");
    expect(u.columns).toEqual([]);
    expect(u.changes).toBe(3);
  });

  it('turns SQL errors into plain messages', () => {
    const db = openDatabase(SQL, sampleDb());
    expect(() => runSql(db, 'SELECT * FROM nope')).toThrow(/no such table/);
    expect(() => runSql(db, 'SELEC 1')).toThrow(ToolError);
    expect(() => runSql(db, '   ')).toThrow(/Type an SQL/);
    expect(() => runSql(db, '-- just a comment')).toThrow(/Type an SQL/);
  });

  it('quotes identifiers safely', () => {
    expect(quoteIdent('a"b')).toBe('"a""b"');
    const db = openDatabase(SQL, sampleDb());
    expect(runSql(db, selectAllSql('odd "name"')).columns).toEqual(['x']);
  });
});
