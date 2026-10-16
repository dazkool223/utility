export interface DecorateOptions {
  numbers: boolean;
  start: number;
  separator: string;
  padNumbers: boolean;
  skipEmpty: boolean;
  prefix: string;
  suffix: string;
  /** Wrap lines longer than this many characters at word boundaries; 0 = off. */
  wrap: number;
}

export const DEFAULT_DECORATE: DecorateOptions = { numbers: true, start: 1, separator: ': ', padNumbers: true, skipEmpty: false, prefix: '', suffix: '', wrap: 0 };

/** Soft-wrap one line at `width` characters, breaking at spaces and hard-breaking words longer than the width. */
export function wrapLine(line: string, width: number): string[] {
  if (width <= 0 || line.length <= width) return [line];
  const out: string[] = [];
  let cur = '';
  const indent = /^\s*/.exec(line)![0];
  for (const word of line.trim().split(/ +/)) {
    let w = word;
    while (w.length > width) {
      if (cur) {
        out.push(cur);
        cur = '';
      }
      out.push(w.slice(0, width));
      w = w.slice(width);
    }
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= width) cur += ' ' + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out.map((l, i) => (i === 0 ? indent + l : l));
}

export function decorateLines(input: string, o: DecorateOptions): string {
  if (input === '') return '';
  const base = input.replace(/\r\n/g, '\n').split('\n');
  const lines = o.wrap > 0 ? base.flatMap((l) => wrapLine(l, o.wrap)) : base;
  const counted = lines.filter((l) => !(o.skipEmpty && l.trim() === '')).length;
  const width = String(o.start + Math.max(counted - 1, 0)).length;
  let n = o.start;
  return lines
    .map((l) => {
      if (o.skipEmpty && l.trim() === '') return l;
      const num = o.numbers ? (o.padNumbers ? String(n).padStart(width, ' ') : String(n)) + o.separator : '';
      n++;
      return `${o.prefix}${num}${l}${o.suffix}`;
    })
    .join('\n');
}

/** Remove leading numbering such as "1. ", "2) ", "  03: " or "4\t". */
export function removeLineNumbers(input: string): string {
  return input
    .split('\n')
    .map((l) => l.replace(/^\s*\d+[.):\]\t-]\s?/, ''))
    .join('\n');
}
