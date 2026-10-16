import { describe, expect, it } from 'vitest';
import { markdownTableToCsv, toMarkdownTable } from './logic';

const o = { delimiter: 'auto', align: 'left', pad: true } as const;

describe('toMarkdownTable', () => {
  it('converts CSV with padded columns', () => {
    expect(toMarkdownTable('name,age\nAda,36\nLinus,54', o)).toBe(
      ['| name  | age |', '| :---- | :-- |', '| Ada   | 36  |', '| Linus | 54  |'].join('\n'),
    );
  });
  it('converts TSV by auto-detecting the delimiter', () => {
    expect(toMarkdownTable('a\tb\n1\t2', { ...o, pad: false })).toBe('| a | b |\n| :-- | :-- |\n| 1 | 2 |');
  });
  it('supports alignment options', () => {
    expect(toMarkdownTable('a,b\n1,2', { ...o, align: 'right', pad: false })).toContain('| --: | --: |');
    expect(toMarkdownTable('a,b\n1,2', { ...o, align: 'center', pad: false })).toContain('| :-: | :-: |');
    expect(toMarkdownTable('a,b\n1,2', { ...o, align: 'none', pad: false })).toContain('| --- | --- |');
  });
  it('escapes pipes and newlines inside cells', () => {
    expect(toMarkdownTable('a\n"x|y"\n"l1\nl2"', { ...o, pad: false })).toBe('| a |\n| :-- |\n| x\\|y |\n| l1<br>l2 |');
  });
  it('fills short rows and measures wide characters by code point', () => {
    expect(toMarkdownTable('a,b,c\n1', { ...o, pad: false }).split('\n')[2]).toBe('| 1 |  |  |');
    expect(toMarkdownTable('n\n🙂\nabc', o).split('\n')[2]).toBe('| 🙂   |');
  });
  it('returns nothing for empty input', () => {
    expect(toMarkdownTable('', o)).toBe('');
  });
  it('handles large tables', () => {
    const csv = 'id,name\n' + Array.from({ length: 50_000 }, (_, i) => `${i},row ${i}`).join('\n');
    expect(toMarkdownTable(csv, o).split('\n')).toHaveLength(50_002);
  });
});

describe('markdownTableToCsv', () => {
  it('converts a table back to CSV', () => {
    expect(markdownTableToCsv('| name | age |\n| :--- | ---: |\n| Ada | 36 |\n| Linus | 54 |')).toBe('name,age\nAda,36\nLinus,54');
  });
  it('handles tables without outer pipes, escaped pipes and br tags', () => {
    expect(markdownTableToCsv('a | b\n--- | ---\nx\\|y | l1<br>l2')).toBe('a,b\nx|y,"l1\nl2"');
  });
  it('round-trips', () => {
    const csv = 'a,b\n1,2\n3,4';
    expect(markdownTableToCsv(toMarkdownTable(csv, o))).toBe(csv);
  });
  it('supports another delimiter', () => {
    expect(markdownTableToCsv('| a | b |\n|---|---|\n| 1 | 2 |', ';')).toBe('a;b\n1;2');
  });
  it('rejects text without a table', () => {
    expect(() => markdownTableToCsv('just text')).toThrow(/No Markdown table/);
  });
});
