import { describe, expect, it } from 'vitest';
import { ToolError } from '@/core/types';
import { cellToText, csvToXlsx, directionFor, parseCsv, sanitiseSheetName, toCellValue, xlsxToCsv } from './logic';

describe('toCellValue', () => {
  it('keeps text that would lose information', () => {
    expect(toCellValue('007', true)).toBe('007');
    expect(toCellValue('12345678901234567890', true)).toBe('12345678901234567890');
    expect(toCellValue('1,5', true)).toBe('1,5');
    expect(toCellValue('abc', true)).toBe('abc');
    expect(toCellValue('', true)).toBe('');
  });
  it('turns plain numbers into numbers', () => {
    expect(toCellValue('42', true)).toBe(42);
    expect(toCellValue('-3.5', true)).toBe(-3.5);
    expect(toCellValue('0.25', true)).toBe(0.25);
    expect(toCellValue('1e3', true)).toBe(1000);
  });
  it('leaves everything as text when numbers are off', () => {
    expect(toCellValue('42', false)).toBe('42');
  });
});

describe('parseCsv', () => {
  it('detects the delimiter and strips a BOM', () => {
    const r = parseCsv('﻿a;b\n1;2\n');
    expect(r.delimiter).toBe(';');
    expect(r.rows).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('handles quoted fields with commas, quotes and newlines', () => {
    const r = parseCsv('a,b\n"x, y","he said ""hi""\nline2"\n');
    expect(r.rows[1]).toEqual(['x, y', 'he said "hi"\nline2']);
  });
  it('rejects empty input', () => {
    expect(() => parseCsv('   \n')).toThrow(ToolError);
  });
  it('rejects unclosed quotes', () => {
    expect(() => parseCsv('a,b\n"oops,1\n')).toThrow(/quote/);
  });
});

describe('csv <-> xlsx round trip', () => {
  const csv = 'name,qty,note\nAda,3,"hello, world"\nLinus,007,\n"Zoë 世界",2.5,=SUM(A1)\n';

  it('produces a zip-based .xlsx', async () => {
    const xlsx = await csvToXlsx(csv);
    expect(xlsx[0]).toBe(0x50);
    expect(xlsx[1]).toBe(0x4b);
  });

  it('round-trips values, keeping leading zeros, unicode and formula-looking text', async () => {
    const back = await xlsxToCsv(await csvToXlsx(csv));
    expect(back.sheetName).toBe('Sheet1');
    expect(back.rows).toBe(4);
    expect(back.csv).toBe('name,qty,note\nAda,3,"hello, world"\nLinus,007,\nZoë 世界,2.5,=SUM(A1)');
  });

  it('writes numbers as numbers when asked, text otherwise', async () => {
    const asNumbers = await xlsxToCsv(await csvToXlsx('a\n1\n'));
    expect(asNumbers.csv).toBe('a\n1');
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await csvToXlsx('a\n1\n', { numbers: true })).buffer as ArrayBuffer);
    expect(typeof wb.worksheets[0]!.getRow(2).getCell(1).value).toBe('number');
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load((await csvToXlsx('a\n1\n', { numbers: false })).buffer as ArrayBuffer);
    expect(typeof wb2.worksheets[0]!.getRow(2).getCell(1).value).toBe('string');
  });

  it('honours the output delimiter and BOM', async () => {
    const xlsx = await csvToXlsx('a,b\n1,"x;y"\n');
    const r = await xlsxToCsv(xlsx, { delimiter: ';', bom: true });
    expect(r.csv).toBe('﻿a;b\n1;"x;y"');
  });

  it('handles ragged rows and a single column', async () => {
    const r = await xlsxToCsv(await csvToXlsx('a,b,c\n1\n1,2,3,4\n'));
    expect(r.csv).toBe('a,b,c,\n1,,,\n1,2,3,4');
    expect((await xlsxToCsv(await csvToXlsx('only\nx\ny\n'))).csv).toBe('only\nx\ny');
  });

  it('uses the sheet name option and cleans illegal characters', async () => {
    expect(sanitiseSheetName('a/b:c?*[x]')).toBe('a b c   x');
    expect(sanitiseSheetName('   ')).toBe('Sheet1');
    expect(sanitiseSheetName('x'.repeat(50))).toHaveLength(31);
    const r = await xlsxToCsv(await csvToXlsx('a\n1', { sheetName: 'People' }), { sheet: 'People' });
    expect(r.sheetNames).toEqual(['People']);
  });

  it('handles a few thousand rows', async () => {
    const lines = ['id,value'];
    for (let i = 0; i < 5000; i++) lines.push(`${i},row ${i}`);
    const r = await xlsxToCsv(await csvToXlsx(lines.join('\n')));
    expect(r.rows).toBe(5001);
    expect(r.csv.split('\n')[5000]).toBe('4999,row 4999');
  });
});

describe('xlsx errors', () => {
  it('rejects non-xlsx bytes', async () => {
    await expect(xlsxToCsv(new TextEncoder().encode('a,b\n1,2'))).rejects.toThrow(/not an \.xlsx/);
  });
  it('rejects legacy .xls', async () => {
    await expect(xlsxToCsv(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0]))).rejects.toThrow(/\.xls/);
  });
  it('rejects a damaged zip', async () => {
    await expect(xlsxToCsv(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5]))).rejects.toThrow(ToolError);
  });
  it('rejects an unknown sheet', async () => {
    await expect(xlsxToCsv(await csvToXlsx('a\n1'), { sheet: 'Nope' })).rejects.toThrow(/Nope/);
  });
});

describe('helpers', () => {
  it('formats cell values', () => {
    expect(cellToText(null)).toBe('');
    expect(cellToText(true)).toBe('true');
    expect(cellToText(new Date('2024-03-05T00:00:00.000Z'))).toBe('2024-03-05');
    expect(cellToText(new Date('2024-03-05T10:20:30.000Z'))).toBe('2024-03-05T10:20:30.000Z');
    expect(cellToText({ formula: 'A1+1', result: 5 })).toBe('5');
    expect(cellToText({ richText: [{ text: 'a' }, { text: 'b' }] })).toBe('ab');
    expect(cellToText({ text: 'site', hyperlink: 'https://x.test' })).toBe('site');
  });
  it('picks the conversion direction', () => {
    expect(directionFor('a.csv', new Uint8Array([97, 44]))).toBe('csv-to-xlsx');
    expect(directionFor('a.xlsx', new Uint8Array([0x50, 0x4b]))).toBe('xlsx-to-csv');
    expect(directionFor('noext', new Uint8Array([0x50, 0x4b]))).toBe('xlsx-to-csv');
  });
});
