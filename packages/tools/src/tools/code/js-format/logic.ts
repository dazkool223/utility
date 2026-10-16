import { runPrettier } from '../_lib/prettier';

export type JsLanguage = 'javascript' | 'typescript';

export interface JsFormatOptions {
  language: JsLanguage;
  indent: '2' | '4' | 'tab';
  printWidth: number;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'all' | 'es5' | 'none';
}

export const DEFAULT_JS_OPTIONS: JsFormatOptions = { language: 'javascript', indent: '2', printWidth: 80, semi: true, singleQuote: true, trailingComma: 'all' };

export function formatJs(input: string, o: JsFormatOptions = DEFAULT_JS_OPTIONS): Promise<string> {
  const { language, semi, singleQuote, trailingComma, ...base } = o;
  return runPrettier(input, language === 'typescript' ? 'babel-ts' : 'babel', 'babel', { ...base, semi, singleQuote, trailingComma }, language === 'typescript' ? 'TypeScript' : 'JavaScript');
}
