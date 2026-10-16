export interface WhitespaceOptions {
  trimLines: boolean;
  collapseSpaces: boolean;
  tabsToSpaces: boolean;
  removeBlankLines: boolean;
  collapseBlankLines: boolean;
  joinLines: boolean;
  stripInvisible: boolean;
  lineEnding: 'keep' | 'lf' | 'crlf';
}

export const DEFAULT_WHITESPACE: WhitespaceOptions = {
  trimLines: true,
  collapseSpaces: true,
  tabsToSpaces: false,
  removeBlankLines: false,
  collapseBlankLines: true,
  joinLines: false,
  stripInvisible: false,
  lineEnding: 'keep',
};

/** Zero-width space/joiners, BOM, word joiner and soft hyphen. */
const INVISIBLE = /[​-‍⁠﻿­]/g;

export function cleanWhitespace(input: string, o: WhitespaceOptions): string {
  let s = input;
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n?/g, '\n');
  if (o.stripInvisible) s = s.replace(INVISIBLE, '');
  s = s.replace(/ /g, ' ');
  if (o.tabsToSpaces) s = s.replace(/\t/g, '    ');
  let lines = s.split('\n');
  if (o.trimLines) lines = lines.map((l) => l.trim());
  else lines = lines.map((l) => l.replace(/[ \t]+$/, ''));
  if (o.collapseSpaces) lines = lines.map((l) => l.replace(/^(\s*)(.*)$/, (_, lead: string, rest: string) => lead + rest.replace(/[ \t]{2,}/g, ' ')));
  if (o.removeBlankLines) lines = lines.filter((l) => l !== '');
  else if (o.collapseBlankLines) lines = lines.filter((l, i) => !(l === '' && lines[i - 1] === ''));
  let out: string;
  if (o.joinLines) out = lines.filter((l) => l !== '').join(' ');
  else {
    const eol = o.lineEnding === 'crlf' || (o.lineEnding === 'keep' && crlf) ? '\r\n' : '\n';
    out = lines.join(eol);
  }
  return out;
}
