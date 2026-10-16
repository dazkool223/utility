import { ToolError } from '@/core/types';

export const SQL_DIALECTS = [
  ['sql', 'Standard SQL'],
  ['postgresql', 'PostgreSQL'],
  ['mysql', 'MySQL'],
  ['mariadb', 'MariaDB'],
  ['sqlite', 'SQLite'],
  ['transactsql', 'SQL Server (T-SQL)'],
  ['plsql', 'Oracle (PL/SQL)'],
  ['bigquery', 'BigQuery'],
  ['snowflake', 'Snowflake'],
  ['redshift', 'Redshift'],
  ['spark', 'Spark'],
  ['trino', 'Trino / Presto'],
] as const;

export type SqlDialect = (typeof SQL_DIALECTS)[number][0];
export type KeywordCase = 'upper' | 'lower' | 'preserve';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  indent: '2' | '4' | 'tab';
  keywordCase: KeywordCase;
  /** Lines between statements. */
  linesBetweenQueries: number;
}

export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = { dialect: 'sql', indent: '2', keywordCase: 'upper', linesBetweenQueries: 1 };

export async function formatSql(input: string, o: SqlFormatOptions = DEFAULT_SQL_OPTIONS): Promise<string> {
  if (!input.trim()) return '';
  const { format } = await import('sql-formatter');
  try {
    return format(input, {
      language: o.dialect,
      tabWidth: o.indent === 'tab' ? 2 : Number(o.indent),
      useTabs: o.indent === 'tab',
      keywordCase: o.keywordCase,
      linesBetweenQueries: o.linesBetweenQueries,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message.split('\n')[0]! : String(e);
    throw new ToolError(`Could not format this SQL: ${msg}. Check the SQL dialect setting and for unbalanced quotes or brackets.`);
  }
}
