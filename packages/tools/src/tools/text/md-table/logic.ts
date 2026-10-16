import Papa from 'papaparse';
import { ToolError } from '@/core/types';

export type Align = 'left' | 'center' | 'right' | 'none';
export type Delim = 'auto' | ',' | '\t' | ';' | '|';

export interface MdTableOptions {
  delimiter: Delim;
  align: Align;
  pad: boolean;
}

const escapeCell = (c: string) => c.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');

function separator(align: Align, width: number): string {
  const w = Math.max(width, 3);
  if (align === 'center') return ':' + '-'.repeat(w - 2) + ':';
  if (align === 'right') return '-'.repeat(w - 1) + ':';
  if (align === 'left') return ':' + '-'.repeat(w - 1);
  return '-'.repeat(w);
}

/** Convert CSV or TSV (first row is the header) to a Markdown table. */
export function toMarkdownTable(input: string, o: MdTableOptions): string {
  const res = Papa.parse<string[]>(input.replace(/^﻿/, ''), { skipEmptyLines: true, ...(o.delimiter === 'auto' ? {} : { delimiter: o.delimiter }) });
  const fatal = res.errors.find((e) => e.type === 'Quotes');
  if (fatal) throw new ToolError(`The table has a quoting problem on row ${(fatal.row ?? 0) + 1}: ${fatal.message}`);
  const rows = res.data;
  if (!rows.length) return '';
  const cols = Math.max(...rows.map((r) => r.length));
  const cells = rows.map((r) => Array.from({ length: cols }, (_, i) => escapeCell((r[i] ?? '').trim())));
  const widths = Array.from({ length: cols }, (_, c) => Math.max(3, ...cells.map((r) => [...r[c]!].length)));
  const fmt = (r: string[]) => '| ' + r.map((c, i) => (o.pad ? c + ' '.repeat(widths[i]! - [...c].length) : c)).join(' | ') + ' |';
  const sep = '| ' + widths.map((w) => separator(o.align, o.pad ? w : 3)).join(' | ') + ' |';
  return [fmt(cells[0]!), sep, ...cells.slice(1).map(fmt)].join('\n');
}

function splitRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (t[i] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else cur += t[i];
  }
  cells.push(cur.trim());
  return cells;
}

/** Convert a Markdown (GitHub-style) table back to CSV. */
export function markdownTableToCsv(input: string, delimiter = ','): string {
  const lines = input.split(/\r?\n/).filter((l) => l.includes('|'));
  if (!lines.length) throw new ToolError('No Markdown table found. A table has lines like | a | b |.');
  const rows = lines.map(splitRow).filter((r) => !r.every((c) => /^:?-{1,}:?$/.test(c)));
  return Papa.unparse(
    rows.map((r) => r.map((c) => c.replace(/<br\s*\/?>/gi, '\n'))),
    { delimiter, newline: '\n' },
  );
}
