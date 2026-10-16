import Papa from 'papaparse';
import { ToolError } from '@/core/types';

export type CsvDelimiter = 'auto' | ',' | ';' | '\t' | '|';

export const MAX_ROWS = 1_048_576;
export const MAX_COLUMNS = 16_384;

const PLAIN_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?$/;

/** A string becomes a number only when doing so loses nothing (no leading zeros, at most 15 significant digits). */
export function toCellValue(raw: string, numbers: boolean): string | number {
  if (!numbers || !PLAIN_NUMBER.test(raw)) return raw;
  const digits = raw.replace(/^﻿/, '').replace(/[eE].*$/, '').replace('.', '').replace(/^0+(?=\d)/, '');
  if (digits.length > 15) return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

export function sanitiseSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31);
  return cleaned || 'Sheet1';
}

/** Parses CSV text into rows of strings, throwing a ToolError if it is not usable. */
export function parseCsv(text: string, delimiter: CsvDelimiter = 'auto'): { rows: string[][]; delimiter: string } {
  const input = text.replace(/^\uFEFF/, '');
  if (!input.trim()) throw new ToolError('The CSV file is empty.');
  const result = Papa.parse<string[]>(input, { delimiter: delimiter === 'auto' ? '' : delimiter, skipEmptyLines: 'greedy' });
  // Papa reports "UndetectableDelimiter" for single-column files; that is fine.
  const fatal = result.errors.find((e) => e.type === 'Quotes');
  if (fatal) throw new ToolError(`The CSV has an unclosed or malformed quote near row ${(fatal.row ?? 0) + 1}.`);
  const rows = result.data;
  if (!rows.length) throw new ToolError('The CSV file has no rows.');
  return { rows, delimiter: result.meta.delimiter };
}

/** Which way a dropped file should be converted. */
export function directionFor(name: string, head: Uint8Array): 'csv-to-xlsx' | 'xlsx-to-csv' {
  if (head[0] === 0x50 && head[1] === 0x4b) return 'xlsx-to-csv';
  if (head[0] === 0xd0 && head[1] === 0xcf) return 'xlsx-to-csv';
  if (/\.xlsx?$/i.test(name)) return 'xlsx-to-csv';
  return 'csv-to-xlsx';
}
