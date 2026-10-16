import { runPrettier } from '../_lib/prettier';

export type CssLanguage = 'css' | 'scss' | 'less';

export interface CssFormatOptions {
  language: CssLanguage;
  indent: '2' | '4' | 'tab';
  singleQuote: boolean;
}

export const DEFAULT_CSS_OPTIONS: CssFormatOptions = { language: 'css', indent: '2', singleQuote: false };

export function formatCss(input: string, o: CssFormatOptions = DEFAULT_CSS_OPTIONS): Promise<string> {
  return runPrettier(input, o.language, 'postcss', { indent: o.indent, printWidth: 80, singleQuote: o.singleQuote }, o.language.toUpperCase());
}
