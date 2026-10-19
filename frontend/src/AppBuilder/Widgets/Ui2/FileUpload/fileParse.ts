// ToolJet UI 2.0 File upload: what parsing a file's content gave, one outcome per file. The native File picker's
// parsers log and toast a failure and return null, so invalid JSON read the same as a file holding null, and CSV rows
// with the wrong number of fields came out with console-only errors. Here the same libraries (and the native rules for
// which files are parsed, and its spreadsheet reader) give `data` and `error`, a message for the file ('' for none).
import JSON5 from 'json5';
import Papa from 'papaparse';

export interface ParseOutcome {
  data: unknown;
  error: string;
}

const NONE: ParseOutcome = { data: null, error: '' };
const failed = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** CSV rows by header, as the native picker parses them; rows Papa reports (wrong field count, bad quotes) are named
 *  in `error` ("people.csv: row 2: Too few fields: expected 2 fields but parsed 1"), and kept as parsed. A repeated
 *  header is renamed by Papa (name, name_1) with only a console warning, so `error` names the renamed columns too: a
 *  binding reading row.name would otherwise miss the second column without a word. */
const csv = (name: string, text: string, delimiter: string): ParseOutcome => {
  const result = Papa.parse(text, {
    header: true,
    delimiter,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  const problems = result.errors
    .slice(0, 5)
    .map((e) => (typeof e.row === 'number' ? `row ${e.row + 1}: ${e.message}` : e.message));
  const more = result.errors.length > problems.length ? ` (and ${result.errors.length - problems.length} more)` : '';
  const renamed = Object.entries(result.meta?.renamedHeaders ?? {});
  if (renamed.length) {
    const shown = renamed.slice(0, 5).map(([to, from]) => `${from} to ${to}`);
    const extra = renamed.length > shown.length ? ` (and ${renamed.length - shown.length} more)` : '';
    problems.unshift(`duplicate headers renamed: ${shown.join(', ')}${extra}`);
  }
  return { data: result.data, error: problems.length ? `${name}: ${problems.join('; ')}${more}` : '' };
};

export const parseContent = async (
  file: File,
  text: string,
  base64Data: string,
  { parseFileType, delimiter }: { parseFileType?: unknown; delimiter?: unknown }
): Promise<ParseOutcome> => {
  const fp = await import('@/AppBuilder/Widgets/FilePicker/helpers/fileProcessing');
  const type = parseFileType || 'auto-detect';
  if (!fp.parseFileContentEnabled(file, type === 'auto-detect', type)) return NONE;
  const T = fp.PARSE_FILE_TYPES;
  const name = String(file.name ?? 'The file');
  switch (file.type) {
    case T.CSV:
    case T.TXT:
      return csv(name, text, type === 'auto-detect' ? ',' : String(delimiter || ','));
    case T.TSV:
      return csv(name, text, '\t');
    case T.JSON:
      try {
        return { data: JSON5.parse(text), error: '' };
      } catch (e) {
        return { data: null, error: `${name} could not be parsed as JSON: ${failed(e)}` };
      }
    case T.XLS:
    case T.XLSX: {
      // The native reader returns null only on failure ({} for an empty sheet).
      const data = await fp.processXls(base64Data);
      return data === null ? { data: null, error: `${name} could not be read as a spreadsheet` } : { data, error: '' };
    }
    default:
      return NONE;
  }
};
