import { expose } from 'comlink';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { Database } from 'sql.js';
import { listSchema, openDatabase, runSql, type QueryResult, type SchemaObject } from './logic';

let db: Database | null = null;
let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

// The SQLite engine is served from our own origin (Vite emits the .wasm next to the app's other assets).
const engine = () => (sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl }));

export const api = {
  async open(bytes: ArrayBuffer): Promise<SchemaObject[]> {
    const SQL = await engine();
    db?.close();
    db = null;
    db = openDatabase(SQL, new Uint8Array(bytes));
    return listSchema(db);
  },
  async query(sql: string, limit?: number): Promise<{ result: QueryResult; schema: SchemaObject[] }> {
    if (!db) throw new Error('No database is open.');
    const result = runSql(db, sql, limit);
    // Schema or row counts may have changed.
    return { result, schema: result.changes !== null ? listSchema(db) : [] };
  },
  async exportDb(): Promise<Uint8Array> {
    if (!db) throw new Error('No database is open.');
    return db.export();
  },
  close() {
    db?.close();
    db = null;
  },
};

expose(api);
