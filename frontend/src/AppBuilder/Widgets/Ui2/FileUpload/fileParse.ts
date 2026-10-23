// ToolJet UI 2.0 File upload: what parsing a file's content gave, one outcome per file. The native File picker's
// parsers log and toast a failure and return null, so invalid JSON read the same as a file holding null, and CSV rows
// with the wrong number of fields came out with console-only errors. Here the same libraries (and the native rules for
// which files are parsed) give `data` and `error`, a message for the file ('' for none).
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

/** The most cells (rows by columns of the sheet's range) converted from a spreadsheet. Converting walks every cell of
 *  the range the sheet declares, filled or not, and a 5 KB file can declare all 17 billion of A1:XFD1048576. */
export const MAX_SHEET_CELLS = 2_000_000;

type Sheets = typeof import('xlsx');
type Sheet = import('xlsx').WorkSheet;
const listed = (items: string[]) =>
  items.slice(0, 5).join(', ') + (items.length > 5 ? ` (and ${items.length - 5} more)` : '');

/** What converting the sheet changes without a word, for parseError: headers the conversion renames (a repeated one
 *  becomes same_1, __proto__ becomes __proto___NaN), so a binding reading the header as written misses the column,
 *  and cells holding an Excel error (#DIV/0!), which come out blank like an empty cell. Each header's name is found by
 *  converting the header row over one row holding the column numbers, so it is the converter's own naming. */
const sheetNotes = (XLSX: Sheets, sheet: Sheet): string[] => {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const probe: Sheet = {
    '!ref': XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1, c: range.e.c - range.s.c } }),
  };
  const labels: [number, string][] = [];
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const header = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const label = header ? XLSX.utils.format_cell(header) : '';
    if (label) labels.push([c, label]);
    if (header) probe[XLSX.utils.encode_cell({ r: 0, c: c - range.s.c })] = header;
    probe[XLSX.utils.encode_cell({ r: 1, c: c - range.s.c })] = { t: 'n', v: c };
  }
  const named = new Map<unknown, string>();
  Object.entries(XLSX.utils.sheet_to_json<Record<string, number>>(probe)[0] ?? {}).forEach(([key, c]) =>
    named.set(c, key)
  );
  const renamed = labels
    .filter(([c, label]) => named.get(c) !== label)
    .map(([c, label]) => (named.has(c) ? `${label} to ${named.get(c)}` : `${label} (left out)`));
  const errors: { r: number; c: number; at: string; text: string }[] = [];
  for (const key of Object.keys(sheet)) {
    const cell = sheet[key];
    if (key.startsWith('!') || cell?.t !== 'e') continue;
    const { r, c } = XLSX.utils.decode_cell(key);
    if (r < range.s.r || r > range.e.r || c < range.s.c || c > range.e.c) continue;
    errors.push({ r, c, at: key, text: XLSX.utils.format_cell(cell) });
  }
  errors.sort((a, b) => a.r - b.r || a.c - b.c);
  return [
    renamed.length ? `headers renamed: ${listed(renamed)}` : '',
    errors.length ? `cells holding errors: ${listed(errors.map((e) => `${e.at} ${e.text}`))}` : '',
  ].filter(Boolean);
};

/** The first sheet's rows by header, as the native reader converts them ({} for an empty sheet), with what
 *  sheetNotes finds in `error`. A declared range within the budget is converted as is, so the result matches the
 *  native reader's (empty header cells included); a larger one ends at the last row and column holding a cell, since
 *  all past them is empty. A sheet whose cells really span more than the budget is not converted: cutting it would
 *  publish part of the data as if it were all of it. */
const spreadsheet = async (name: string, base64Data: string): Promise<ParseOutcome> => {
  const unreadable = { data: null, error: `${name} could not be read as a spreadsheet` };
  try {
    // eslint-disable-next-line import/no-unresolved
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(atob(base64Data), { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return unreadable;
    const ref = sheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      const size = () => [range.e.r - range.s.r + 1, range.e.c - range.s.c + 1];
      const [rows, cols] = size();
      if (rows * cols > MAX_SHEET_CELLS) {
        const end = { r: range.s.r, c: range.s.c };
        for (const key of Object.keys(sheet)) {
          if (key.startsWith('!')) continue;
          const { r, c } = XLSX.utils.decode_cell(key);
          if (r < range.s.r || r > range.e.r || c < range.s.c || c > range.e.c) continue;
          end.r = Math.max(end.r, r);
          end.c = Math.max(end.c, c);
        }
        range.e = end;
        const [usedRows, usedCols] = size();
        if (usedRows * usedCols > MAX_SHEET_CELLS) {
          return {
            data: null,
            error: `${name}: the first sheet is too large to read (${usedRows} rows by ${usedCols} columns; the limit is ${MAX_SHEET_CELLS} cells)`,
          };
        }
        sheet['!ref'] = XLSX.utils.encode_range(range);
      }
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const notes = sheetNotes(XLSX, sheet);
    return { data: rows.length ? { Sheet1: rows } : {}, error: notes.length ? `${name}: ${notes.join('; ')}` : '' };
  } catch {
    return unreadable;
  }
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
    case T.XLSX:
      return spreadsheet(name, base64Data);
    default:
      return NONE;
  }
};
