declare module 'papaparse' {
  interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }
  interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: { delimiter: string; fields?: string[] };
  }
  interface ParseConfig {
    header?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean | 'greedy';
    dynamicTyping?: boolean;
  }
  const Papa: {
    parse<T = unknown>(input: string, config?: ParseConfig): ParseResult<T>;
    unparse(data: unknown, config?: { delimiter?: string; newline?: string; header?: boolean }): string;
  };
  export default Papa;
}
