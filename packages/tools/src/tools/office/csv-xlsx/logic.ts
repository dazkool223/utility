import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { ToolError } from '@/core/types';
import { MAX_COLUMNS, MAX_ROWS, parseCsv, sanitiseSheetName, toCellValue, type CsvDelimiter } from './parse';

// Pure CSV helpers live in ./parse so the Tool's main chunk does not pull in ExcelJS.
export * from './parse';

export const PREVIEW_ROWS = 20;

export interface CsvToXlsxOptions {
  delimiter?: CsvDelimiter;
  sheetName?: string;
  /** Store values that look like plain numbers as numbers (leading zeros and long digit strings stay text). */
  numbers?: boolean;
  /** Bold the first row and freeze it. */
  header?: boolean;
}

export interface XlsxToCsvOptions {
  /** Sheet name; defaults to the first sheet. */
  sheet?: string;
  delimiter?: Exclude<CsvDelimiter, 'auto'>;
  /** Prefix the CSV with a UTF-8 byte order mark so Excel opens it as UTF-8. */
  bom?: boolean;
}

export interface XlsxToCsvResult {
  csv: string;
  sheetNames: string[];
  sheetName: string;
  rows: number;
  preview: string[][];
}

export interface CsvToXlsxResult {
  bytes: Uint8Array;
  rows: number;
  preview: string[][];
}

/** Builds an .xlsx workbook with one sheet from CSV text. */
export async function csvToXlsxDetailed(csv: string, options: CsvToXlsxOptions = {}): Promise<CsvToXlsxResult> {
  const { rows } = parseCsv(csv, options.delimiter ?? 'auto');
  if (rows.length > MAX_ROWS) throw new ToolError(`An Excel sheet holds at most ${MAX_ROWS.toLocaleString()} rows; this CSV has ${rows.length.toLocaleString()}.`);
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (width > MAX_COLUMNS) throw new ToolError(`An Excel sheet holds at most ${MAX_COLUMNS.toLocaleString()} columns; this CSV has ${width.toLocaleString()}.`);

  const header = options.header !== false;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sanitiseSheetName(options.sheetName ?? 'Sheet1'), header ? { views: [{ state: 'frozen', ySplit: 1 }] } : undefined);
  const numbers = options.numbers ?? true;
  rows.forEach((row, i) => {
    const values: Array<string | number | undefined> = row.map((cell) => (i === 0 && header ? cell : toCellValue(cell, numbers)));
    for (let c = 0; c < values.length; c++) if (values[c] === '') values[c] = undefined;
    sheet.addRow(values);
  });
  if (header) sheet.getRow(1).font = { bold: true };
  const out = await workbook.xlsx.writeBuffer();
  return { bytes: new Uint8Array(out as ArrayBuffer), rows: rows.length, preview: rows.slice(0, PREVIEW_ROWS) };
}

export async function csvToXlsx(csv: string, options: CsvToXlsxOptions = {}): Promise<Uint8Array> {
  return (await csvToXlsxDetailed(csv, options)).bytes;
}

type CellValue = ExcelJS.CellValue;

/** Converts any ExcelJS cell value to the text a CSV would hold. */
export function cellToText(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  if (typeof value === 'object') {
    const v = value as unknown as Record<string, unknown>;
    if ('richText' in v && Array.isArray(v.richText)) return (v.richText as Array<{ text: string }>).map((t) => t.text).join('');
    if ('formula' in v || 'sharedFormula' in v) return cellToText((v.result ?? '') as CellValue);
    if ('hyperlink' in v) return cellToText((v.text ?? v.hyperlink) as CellValue);
    if ('error' in v) return String(v.error);
    return JSON.stringify(v);
  }
  return String(value);
}

/** Reads an .xlsx workbook and returns one sheet as CSV. */
export async function xlsxToCsv(bytes: ArrayBuffer | Uint8Array, options: XlsxToCsvOptions = {}): Promise<XlsxToCsvResult> {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (view[0] === 0xd0 && view[1] === 0xcf) throw new ToolError('This looks like an old .xls file (or an encrypted workbook). Save it as .xlsx first; only .xlsx is supported.');
  if (view[0] !== 0x50 || view[1] !== 0x4b) throw new ToolError('This is not an .xlsx file (it is not a zip-based Office document).');
  const workbook = new ExcelJS.Workbook();
  try {
    const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    await workbook.xlsx.load(buffer as ArrayBuffer);
  } catch {
    throw new ToolError('This file could not be read as an .xlsx workbook. It may be damaged, encrypted or in another format.');
  }
  const sheetNames = workbook.worksheets.map((w) => w.name);
  if (!sheetNames.length) throw new ToolError('The workbook has no sheets.');
  const sheet = options.sheet ? workbook.getWorksheet(options.sheet) : workbook.worksheets[0];
  if (!sheet) throw new ToolError(`There is no sheet named "${options.sheet}".`);

  const rows: string[][] = [];
  const width = sheet.actualColumnCount > 0 ? sheet.columnCount : 0;
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= width; c++) cells.push(cellToText(row.getCell(c).value));
    rows.push(cells);
  }
  while (rows.length && rows[rows.length - 1]!.every((c) => c === '')) rows.pop();
  const csv = Papa.unparse(rows, { delimiter: options.delimiter ?? ',', newline: '\n' });
  return { csv: (options.bom ? '﻿' : '') + csv, sheetNames, sheetName: sheet.name, rows: rows.length, preview: rows.slice(0, PREVIEW_ROWS) };
}
