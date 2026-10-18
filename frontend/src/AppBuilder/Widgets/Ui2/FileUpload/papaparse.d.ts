// papaparse ships no types and @types/papaparse is not installed: the part of its API the pack's TypeScript uses.
declare module 'papaparse' {
  interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }
  interface ParseResult {
    data: Record<string, unknown>[];
    errors: ParseError[];
  }
  interface ParseConfig {
    header?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean | 'greedy';
    transformHeader?: (header: string) => string;
  }
  const Papa: { parse: (input: string, config?: ParseConfig) => ParseResult };
  export default Papa;
}
