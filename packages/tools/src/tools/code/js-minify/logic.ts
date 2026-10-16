import { ToolError } from '@/core/types';

export interface JsMinifyOptions {
  mangle: boolean;
  compress: boolean;
  /** Treat the code as an ES module (allows import/export and top-level await, enables top-level renaming). */
  module: boolean;
  keepComments: 'none' | 'license';
}

export const DEFAULT_JS_MINIFY: JsMinifyOptions = { mangle: true, compress: true, module: false, keepComments: 'none' };

export async function minifyJs(input: string, o: JsMinifyOptions = DEFAULT_JS_MINIFY): Promise<string> {
  if (!input.trim()) return '';
  const { minify } = await import('terser');
  try {
    const out = await minify(input, {
      mangle: o.mangle,
      compress: o.compress,
      module: o.module,
      format: { comments: o.keepComments === 'license' ? /@license|@preserve|^!/ : false },
    });
    return out.code ?? '';
  } catch (e) {
    const err = e as { message?: string; line?: number; col?: number };
    const at = err.line !== undefined ? ` (line ${err.line}, column ${err.col ?? 0})` : '';
    throw new ToolError(`Could not read this JavaScript: ${err.message ?? String(e)}${at}`);
  }
}
