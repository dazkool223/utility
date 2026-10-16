import { ToolError } from '@/core/types';

export interface CssMinifyOptions {
  /** Restructure rules (merge, reorder) for smaller output. Can change cascade order in rare cases. */
  restructure: boolean;
  /** Keep comments starting with /*! (licence headers). */
  keepBangComments: boolean;
}

export const DEFAULT_CSS_MINIFY: CssMinifyOptions = { restructure: false, keepBangComments: true };

/** Browsers silently close open blocks and strings at the end of a file; that is almost always a typo, so report it. */
function checkBalanced(css: string): void {
  let depth = 0;
  let line = 1;
  for (let i = 0; i < css.length; i++) {
    const c = css[i]!;
    if (c === '\n') line++;
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) throw new ToolError(`Could not read this CSS: a comment starting on line ${line} is never closed.`);
      line += css.slice(i, end).split('\n').length - 1;
      i = end + 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) {
        if (css[j] === '\\') j++;
        else if (css[j] === '\n') throw new ToolError(`Could not read this CSS: a string starting on line ${line} is never closed.`);
        j++;
      }
      if (j >= css.length) throw new ToolError(`Could not read this CSS: a string starting on line ${line} is never closed.`);
      i = j;
    } else if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth < 0) throw new ToolError(`Could not read this CSS: unexpected } on line ${line}.`);
  }
  if (depth > 0) throw new ToolError(`Could not read this CSS: ${depth} { ${depth === 1 ? 'is' : 'are'} never closed.`);
}

export async function minifyCss(input: string, o: CssMinifyOptions = DEFAULT_CSS_MINIFY): Promise<string> {
  if (!input.trim()) return '';
  checkBalanced(input);
  const csso = await import('csso');
  // csso repairs broken CSS silently, so check the syntax first and report problems.
  let firstError: { message: string; line?: number; column?: number } | null = null;
  csso.syntax.parse(input, {
    positions: true,
    onParseError: (e: { message: string; line?: number; column?: number }) => {
      firstError ??= e;
    },
  });
  if (firstError) {
    const e = firstError as { message: string; line?: number; column?: number };
    throw new ToolError(`Could not read this CSS: ${e.message.replace(/ is expected$/, ' expected')}${e.line ? ` (line ${e.line}, column ${e.column ?? 1})` : ''}`);
  }
  return csso.minify(input, { restructure: o.restructure, comments: o.keepBangComments ? 'exclamation' : false }).css;
}
