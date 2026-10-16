import { ToolError } from '@/core/types';

export interface RegexRequest {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  /** Stop collecting after this many matches. */
  limit: number;
}

export interface RegexMatch {
  index: number;
  end: number;
  match: string;
  groups: Array<string | undefined>;
  named: Record<string, string | undefined>;
}

export interface RegexResult {
  matches: RegexMatch[];
  truncated: boolean;
  /** Result of String.replace with the replacement text, when one was given. */
  replaced: string | null;
}

export const FLAGS: ReadonlyArray<{ flag: string; label: string; title: string }> = [
  { flag: 'g', label: 'g', title: 'Global: find all matches' },
  { flag: 'i', label: 'i', title: 'Ignore case' },
  { flag: 'm', label: 'm', title: 'Multiline: ^ and $ match at line breaks' },
  { flag: 's', label: 's', title: 'Dot matches line breaks' },
  { flag: 'u', label: 'u', title: 'Unicode mode' },
  { flag: 'y', label: 'y', title: 'Sticky: match only at lastIndex' },
];

export function compileRegex(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    const msg = e instanceof Error ? e.message.replace(/^Invalid regular expression: /, '') : String(e);
    throw new ToolError(`Invalid regular expression: ${msg}`);
  }
}

/** Runs a JavaScript regular expression. Call it from a Worker: a pattern with catastrophic backtracking never returns. */
export function runRegex({ pattern, flags, text, replacement, limit }: RegexRequest): RegexResult {
  const re = compileRegex(pattern, flags);
  const matches: RegexMatch[] = [];
  let truncated = false;
  const collect = (m: RegExpExecArray) => ({
    index: m.index,
    end: m.index + m[0].length,
    match: m[0],
    groups: m.slice(1),
    named: { ...(m.groups ?? {}) },
  });
  if (re.global || re.sticky) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (matches.length >= limit) {
        truncated = true;
        break;
      }
      matches.push(collect(m));
      if (m[0] === '') re.lastIndex += re.unicode && (text.codePointAt(re.lastIndex) ?? 0) > 0xffff ? 2 : 1;
      if (!re.global) break;
    }
  } else {
    const m = re.exec(text);
    if (m) matches.push(collect(m));
  }
  let replaced: string | null = null;
  if (replacement !== '') {
    re.lastIndex = 0;
    replaced = text.replace(re, replacement);
  }
  return { matches, truncated, replaced };
}
