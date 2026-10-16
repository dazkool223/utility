declare module 'csso' {
  export interface MinifyOptions {
    restructure?: boolean;
    comments?: boolean | 'exclamation' | 'first-exclamation';
    sourceMap?: boolean;
    [key: string]: unknown;
  }
  export function minify(source: string, options?: MinifyOptions): { css: string; map: unknown };
  export const syntax: {
    parse(source: string, options?: Record<string, unknown>): unknown;
    [key: string]: unknown;
  };
}
