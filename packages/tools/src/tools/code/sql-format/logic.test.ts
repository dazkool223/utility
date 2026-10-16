import { describe, expect, it } from 'vitest';
import { DEFAULT_SQL_OPTIONS, formatSql } from './logic';

describe('formatSql', () => {
  it('formats a simple query', async () => {
    expect(await formatSql('select a,b from t where x=1 and y=2')).toBe('SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1\n  AND y = 2');
  });
  it('supports 4 spaces, tabs and keyword case', async () => {
    expect(await formatSql('select a from t', { ...DEFAULT_SQL_OPTIONS, indent: '4', keywordCase: 'lower' })).toBe('select\n    a\nfrom\n    t');
    expect(await formatSql('select a from t', { ...DEFAULT_SQL_OPTIONS, indent: 'tab' })).toBe('SELECT\n\ta\nFROM\n\tt');
    expect(await formatSql('SELECT a FROM t', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'preserve' })).toContain('SELECT');
  });
  it('separates statements', async () => {
    expect(await formatSql('select 1; select 2;')).toBe('SELECT\n  1;\n\nSELECT\n  2;');
  });
  it('knows dialect specifics', async () => {
    const pg = await formatSql(`select data->>'k' from t`, { ...DEFAULT_SQL_OPTIONS, dialect: 'postgresql' });
    expect(pg).toContain(`data ->> 'k'`);
  });
  it('keeps unicode and comments', async () => {
    const out = await formatSql(`-- héllo\nselect 'ü' from t`);
    expect(out).toContain('-- héllo');
    expect(out).toContain("'ü'");
  });
  it('returns empty output for empty input', async () => {
    expect(await formatSql('  ')).toBe('');
  });
  it('reports unterminated strings', async () => {
    await expect(formatSql(`select 'abc from t`)).rejects.toThrow('Could not format this SQL');
  });
});
