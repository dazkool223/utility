import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';

export type Dialect = 'postgres' | 'mysql' | 'sqlite' | 'mssql';
export interface SqlOptions {
  table: string;
  dialect: Dialect;
  createTable: boolean;
}

type Obj = Record<string, unknown>;
type Kind = 'integer' | 'number' | 'boolean' | 'string' | 'json' | 'null';

function kindOf(v: unknown): Kind {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  if (typeof v === 'string') return 'string';
  return 'json';
}

const TYPES: Record<Dialect, Record<Kind, string>> = {
  postgres: { integer: 'BIGINT', number: 'DOUBLE PRECISION', boolean: 'BOOLEAN', string: 'TEXT', json: 'JSONB', null: 'TEXT' },
  mysql: { integer: 'BIGINT', number: 'DOUBLE', boolean: 'TINYINT(1)', string: 'TEXT', json: 'JSON', null: 'TEXT' },
  sqlite: { integer: 'INTEGER', number: 'REAL', boolean: 'INTEGER', string: 'TEXT', json: 'TEXT', null: 'TEXT' },
  mssql: { integer: 'BIGINT', number: 'FLOAT', boolean: 'BIT', string: 'NVARCHAR(MAX)', json: 'NVARCHAR(MAX)', null: 'NVARCHAR(MAX)' },
};

export function quoteIdent(name: string, d: Dialect): string {
  if (d === 'mysql') return '`' + name.replace(/`/g, '``') + '`';
  if (d === 'mssql') return '[' + name.replace(/]/g, ']]') + ']';
  return '"' + name.replace(/"/g, '""') + '"';
}

function literal(v: unknown, d: Dialect): string {
  const k = kindOf(v);
  if (k === 'null') return 'NULL';
  if (k === 'boolean') return d === 'postgres' ? (v ? 'TRUE' : 'FALSE') : v ? '1' : '0';
  if (k === 'integer' || k === 'number') return String(v);
  let s = k === 'json' ? JSON.stringify(v) : (v as string);
  s = s.replace(/'/g, "''");
  if (d === 'mysql') s = s.replace(/\\/g, '\\\\');
  return (d === 'mssql' ? 'N' : '') + `'${s}'`;
}

export function jsonToSql(input: string, { table, dialect, createTable }: SqlOptions): string {
  const data = parseJson(input);
  const rows = (Array.isArray(data) ? data : [data]) as unknown[];
  if (!rows.length) throw new ToolError('The JSON array is empty, so there are no rows to insert.');
  if (!rows.every((r): r is Obj => !!r && typeof r === 'object' && !Array.isArray(r))) throw new ToolError('Every item must be a JSON object (one object per row).');
  const columns: string[] = [];
  const kinds = new Map<string, Set<Kind>>();
  for (const r of rows as Obj[]) {
    for (const [k, v] of Object.entries(r)) {
      if (!kinds.has(k)) {
        kinds.set(k, new Set());
        columns.push(k);
      }
      const kind = kindOf(v);
      if (kind !== 'null') kinds.get(k)!.add(kind);
    }
  }
  if (!columns.length) throw new ToolError('The objects have no keys, so there are no columns to create.');
  const t = quoteIdent(table || 'my_table', dialect);
  const out: string[] = [];
  if (createTable) {
    const defs = columns.map((c) => {
      const ks = [...kinds.get(c)!];
      let kind: Kind = ks.length === 0 ? 'null' : ks[0]!;
      if (ks.length > 1) kind = ks.every((x) => x === 'integer' || x === 'number') ? 'number' : 'string';
      return `  ${quoteIdent(c, dialect)} ${TYPES[dialect][kind]}`;
    });
    out.push(`CREATE TABLE ${t} (\n${defs.join(',\n')}\n);`);
  }
  const cols = columns.map((c) => quoteIdent(c, dialect)).join(', ');
  const values = (rows as Obj[]).map((r) => '  (' + columns.map((c) => literal(r[c], dialect)).join(', ') + ')');
  out.push(`INSERT INTO ${t} (${cols}) VALUES\n${values.join(',\n')};`);
  return out.join('\n\n');
}
