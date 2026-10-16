import { ToolError } from '@/core/types';

export interface PrettierBase {
  indent: '2' | '4' | 'tab';
  printWidth: number;
}

type Plugin = import('prettier').Plugin;

/** Lazy-loaded Prettier standalone with only the plugins a given language needs. */
export async function runPrettier(input: string, parser: string, plugins: 'babel' | 'postcss', o: PrettierBase & Record<string, unknown>, what: string): Promise<string> {
  if (!input.trim()) return '';
  const prettier = await import('prettier/standalone');
  const list: Plugin[] =
    plugins === 'babel'
      ? [(await import('prettier/plugins/babel')) as unknown as Plugin, (await import('prettier/plugins/estree')) as unknown as Plugin]
      : [(await import('prettier/plugins/postcss')) as unknown as Plugin];
  const { indent, printWidth, ...rest } = o;
  try {
    const out = await prettier.format(input, {
      parser,
      plugins: list,
      tabWidth: indent === 'tab' ? 2 : Number(indent),
      useTabs: indent === 'tab',
      printWidth,
      ...rest,
    });
    return out.replace(/\n$/, '');
  } catch (e) {
    const err = e as { message?: string; loc?: { start?: { line: number; column: number } } };
    const first = (err.message ?? String(e)).split('\n')[0]!.replace(/\s*\(\d+:\d+\)\s*$/, '');
    const at = err.loc?.start ? ` (line ${err.loc.start.line}, column ${err.loc.start.column})` : '';
    throw new ToolError(`Could not read this ${what}: ${first}${at}`);
  }
}
