import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import { ToolError } from '@/core/types';

export const ROW_LIMIT = 1000;

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
}

export interface SchemaObject {
  name: string;
  kind: 'table' | 'view';
  columns: ColumnInfo[];
  /** Row count; null for views (counting them can be slow). */
  rows: number | null;
  sql: string;
}

export type Cell = string | number | null | { blob: number };

export interface QueryResult {
  columns: string[];
  rows: Cell[][];
  /** More rows exist than were returned. */
  truncated: boolean;
  /** Statements that changed data report how many rows they touched. */
  changes: number | null;
  statements: number;
  millis: number;
}

const HEADER = 'SQLite format 3\0';

export function isSqliteFile(bytes: Uint8Array): boolean {
  if (bytes.length < HEADER.length) return false;
  for (let i = 0; i < HEADER.length; i++) if (bytes[i] !== HEADER.charCodeAt(i)) return false;
  return true;
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function selectAllSql(name: string, limit = 100): string {
  return `SELECT * FROM ${quoteIdent(name)} LIMIT ${limit};`;
}

function plain(v: SqlValue): Cell {
  if (v instanceof Uint8Array) return { blob: v.length };
  return v;
}

/** Opens a database from bytes. Throws a ToolError if the bytes are not a SQLite database. */
export function openDatabase(SQL: SqlJsStatic, bytes: Uint8Array): Database {
  if (!isSqliteFile(bytes)) throw new ToolError('This is not a SQLite database file (it does not start with "SQLite format 3").');
  try {
    const db = new SQL.Database(bytes);
    // Opening is lazy; touch the schema so a damaged file fails here and not on the first query.
    db.exec('SELECT count(*) FROM sqlite_master');
    return db;
  } catch (e) {
    throw new ToolError(`The database could not be opened: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Lists tables and views with their columns and row counts. */
export function listSchema(db: Database): SchemaObject[] {
  const out: SchemaObject[] = [];
  const master = db.exec("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")[0];
  for (const [name, type, sql] of master?.values ?? []) {
    const columns: ColumnInfo[] = [];
    const info = db.exec(`PRAGMA table_info(${quoteIdent(String(name))})`)[0];
    for (const row of info?.values ?? []) {
      columns.push({ name: String(row[1]), type: String(row[2] ?? ''), notNull: Number(row[3]) === 1, primaryKey: Number(row[5]) > 0 });
    }
    let rows: number | null = null;
    if (type === 'table') {
      try {
        rows = Number(db.exec(`SELECT count(*) FROM ${quoteIdent(String(name))}`)[0]?.values[0]?.[0] ?? 0);
      } catch {
        rows = null; // virtual tables whose module is missing
      }
    }
    out.push({ name: String(name), kind: type === 'view' ? 'view' : 'table', columns, rows, sql: String(sql ?? '') });
  }
  return out;
}

/**
 * Runs one or more SQL statements. The rows of the last statement that returns any are reported
 * (at most `limit`), so `SELECT * FROM huge_table` never copies the whole table.
 */
export function runSql(db: Database, sql: string, limit = ROW_LIMIT): QueryResult {
  if (!sql.trim()) throw new ToolError('Type an SQL statement to run.');
  const started = Date.now();
  let columns: string[] = [];
  let rows: Cell[][] = [];
  let truncated = false;
  let statements = 0;
  let changes: number | null = null;
  try {
    for (const stmt of db.iterateStatements(sql)) {
      statements++;
      try {
        const names = stmt.getColumnNames();
        if (names.length) {
          columns = names;
          rows = [];
          truncated = false;
          while (stmt.step()) {
            if (rows.length >= limit) {
              truncated = true;
              break;
            }
            rows.push(stmt.get().map(plain));
          }
        } else {
          stmt.step();
          changes = db.getRowsModified();
        }
      } finally {
        stmt.free();
      }
    }
  } catch (e) {
    throw new ToolError(e instanceof Error ? e.message : String(e));
  }
  if (statements === 0) throw new ToolError('Type an SQL statement to run.');
  return { columns, rows, truncated, changes: columns.length ? null : changes, statements, millis: Date.now() - started };
}

export function describeCell(c: Cell): string {
  if (c === null) return 'NULL';
  if (typeof c === 'object') return `<BLOB ${c.blob} bytes>`;
  return String(c);
}
